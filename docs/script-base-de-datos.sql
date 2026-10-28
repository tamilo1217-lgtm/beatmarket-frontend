-- BeatMarket - script de la base de datos (MariaDB)
-- Solo la tabla `usuario` esta implementada en el backend hoy (la crea Spring con ddl-auto=update).
-- Las demas tablas son el diseno de las siguientes fases.

CREATE DATABASE IF NOT EXISTS beatmarketDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beatmarketDB;

-- ---------------------------------------------------------------
-- IMPLEMENTADA: usuario (CRUD completo + login con JWT)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
    id             INT           NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(150)  NOT NULL,
    nombreUsuario  VARCHAR(100)  NOT NULL,
    email          VARCHAR(150)  NOT NULL,
    password       VARCHAR(255)  NOT NULL,              -- hash BCrypt, nunca texto plano
    rol            VARCHAR(20)   NOT NULL,              -- ADMIN, PRODUCTOR o COMPRADOR
    estado         VARCHAR(20)   NOT NULL DEFAULT 'ACTIVO',
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuario_nombreUsuario (nombreUsuario),
    UNIQUE KEY uq_usuario_email (email),
    CONSTRAINT ck_usuario_rol CHECK (rol IN ('ADMIN', 'PRODUCTOR', 'COMPRADOR'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- PLANEADAS (siguiente fase)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS genero (
    id      INT          NOT NULL AUTO_INCREMENT,
    nombre  VARCHAR(50)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_genero_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS licencia (
    id           INT            NOT NULL AUTO_INCREMENT,
    nombre       VARCHAR(30)    NOT NULL,                -- Basica, Premium, Exclusiva
    factor       DECIMAL(4,1)   NOT NULL,                -- multiplica el precio del beat (1, 2.4, 8)
    descripcion  VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uq_licencia_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS beat (
    id              INT            NOT NULL AUTO_INCREMENT,
    titulo          VARCHAR(60)    NOT NULL,
    descripcion     VARCHAR(320),
    bpm             INT            NOT NULL,
    precio          DECIMAL(10,0)  NOT NULL,             -- precio de la licencia basica, en COP
    reproducciones  INT            NOT NULL DEFAULT 0,
    fechaCreacion   DATE           NOT NULL,
    generoId        INT            NOT NULL,
    productorId     INT            NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_beat_genero    FOREIGN KEY (generoId)    REFERENCES genero (id),
    CONSTRAINT fk_beat_productor FOREIGN KEY (productorId) REFERENCES usuario (id),
    CONSTRAINT ck_beat_bpm CHECK (bpm BETWEEN 60 AND 170)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS compra (
    id           INT            NOT NULL AUTO_INCREMENT,
    fecha        DATE           NOT NULL,
    valor        DECIMAL(10,0)  NOT NULL,                -- precio del beat x factor de la licencia
    beatId       INT            NOT NULL,
    compradorId  INT            NOT NULL,
    licenciaId   INT            NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_compra_beat      FOREIGN KEY (beatId)      REFERENCES beat (id),
    CONSTRAINT fk_compra_comprador FOREIGN KEY (compradorId) REFERENCES usuario (id),
    CONSTRAINT fk_compra_licencia  FOREIGN KEY (licenciaId)  REFERENCES licencia (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resena (
    id            INT          NOT NULL AUTO_INCREMENT,
    calificacion  INT          NOT NULL,
    comentario    VARCHAR(500),
    fecha         DATE         NOT NULL,
    beatId        INT          NOT NULL,
    usuarioId     INT          NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_resena_beat    FOREIGN KEY (beatId)    REFERENCES beat (id),
    CONSTRAINT fk_resena_usuario FOREIGN KEY (usuarioId) REFERENCES usuario (id),
    CONSTRAINT ck_resena_calificacion CHECK (calificacion BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- Datos base
INSERT IGNORE INTO genero (nombre) VALUES ('Boombap'), ('Trap'), ('Drill'), ('Lo-fi'), ('Dembow'), ('Jazz');
INSERT IGNORE INTO licencia (nombre, factor, descripcion) VALUES
    ('Basica',    1.0, 'MP3, un proyecto, hasta 10.000 reproducciones'),
    ('Premium',   2.4, 'WAV y pistas separadas, proyectos ilimitados, uso comercial'),
    ('Exclusiva', 8.0, 'Derechos exclusivos del beat, WAV y pistas separadas, uso comercial');
