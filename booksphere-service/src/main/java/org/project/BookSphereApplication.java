package org.project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BookSphereApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookSphereApplication.class, args);
    }
}