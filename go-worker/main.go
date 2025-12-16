package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/streadway/amqp"
)

func main() {
	rabbitURL := os.Getenv("RABBITMQ_URL")

	if rabbitURL == "" {
		log.Fatal("❌ RABBITMQ_URL não definida no ambiente!")
	}

	log.Println("🔌 Conectando ao RabbitMQ em:", rabbitURL)

	var conn *amqp.Connection
	var err error

	// Tentativa de reconexão
	for {
		conn, err = amqp.Dial(rabbitURL)
		if err == nil {
			break
		}

		log.Println("❌ RabbitMQ indisponível:", err)
		log.Println("⏳ Tentando novamente em 5s...")
		time.Sleep(5 * time.Second)
	}

	log.Println("✅ Conectado ao RabbitMQ!")

	ch, err := conn.Channel()
	if err != nil {
		log.Fatal("❌ Erro ao abrir canal:", err)
	}

	queue, err := ch.QueueDeclare(
		"gdash.weather.logs",
		true,
		false,
		false,
		false,
		nil,
	)

	if err != nil {
		log.Fatal("❌ Erro ao declarar fila:", err)
	}

	log.Println("📩 Esperando mensagens da fila:", queue.Name)

	msgs, err := ch.Consume(
		queue.Name,
		"",
		true,
		false,
		false,
		false,
		nil,
	)

	if err != nil {
		log.Fatal("❌ Erro ao consumir fila:", err)
	}

	forever := make(chan bool)

	go func() {
		for msg := range msgs {
			fmt.Println("🌤️ Mensagem recebida:", string(msg.Body))
		}
	}()

	<-forever
}
