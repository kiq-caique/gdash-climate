package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/streadway/amqp"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func getenv(key, def string) string {
	value := os.Getenv(key)
	if value == "" {
		return def
	}
	return value
}

func main() {
	rabbitURL := getenv("RABBITMQ_URL", "amqp://gdash:gdash@localhost:5672/")
	queueName := getenv("RABBITMQ_QUEUE", "gdash.weather.logs")

	mongoURI := getenv("MONGODB_URI", "mongodb://localhost:27017")
	mongoDB := getenv("MONGODB_DB", "gdash_climate")
	mongoCollection := getenv("MONGODB_COLLECTION", "weatherlogs") // ajusta se tua collection tiver outro nome

	log.Println("[worker] conectando ao RabbitMQ em", rabbitURL)
	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		log.Fatalf("erro ao conectar no RabbitMQ: %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("erro ao abrir canal no RabbitMQ: %v", err)
	}
	defer ch.Close()

	_, err = ch.QueueDeclare(
		queueName,
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("erro ao declarar fila: %v", err)
	}

	msgs, err := ch.Consume(
		queueName,
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("erro ao registrar consumidor: %v", err)
	}

	log.Println("[worker] conectando ao Mongo em", mongoURI)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("erro ao conectar no MongoDB: %v", err)
	}
	defer func() {
		_ = client.Disconnect(context.Background())
	}()

	collection := client.Database(mongoDB).Collection(mongoCollection)

	log.Println("[worker] aguardando mensagens na fila", queueName)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	for {
		select {
		case msg := <-msgs:
			if len(msg.Body) == 0 {
				continue
			}

			var payload map[string]interface{}
			if err := json.Unmarshal(msg.Body, &payload); err != nil {
				log.Printf("erro ao fazer parse da mensagem: %v", err)
				continue
			}

			payload["createdAt"] = time.Now()

			_, err := collection.InsertOne(context.Background(), payload)
			if err != nil {
				log.Printf("erro ao salvar no MongoDB: %v", err)
				continue
			}

			userID, ok := payload["userId"]
			if !ok {
				userID = "<sem userId>"
			}
			log.Printf("[worker] log salvo com sucesso (userId=%v)", userID)

		case <-sigChan:
			log.Println("[worker] sinal de encerramento recebido, saindo...")
			return
		}
	}
}
