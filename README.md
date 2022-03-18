# Cron-extend

## Информация

Сервис для запуска задаяч в формате cron

## Оглавление:
- [Установка](#install)
- [Запуска](#launch)
- [Конфигурация](#configuration)
- [Задачи](#jobs)
- [API](#api)

## <a name="install"></a> Запуск

пример строки запуска: `node /cron-extend/app.js -c config.toml`

## <a name="launch"></a> Таблица ключей запуска

Ключ | Описание
------------ | -------------
--version, -v | вывести номер версии приложения
--help, -h | вызвать справку по ключам запуска
--config, -c | путь к файлу конфигурации в формате toml или json, (переменная среды: CRON_EXTEND_CONFIG_PATH)

## <a name="configuration"></a> Конфигурация

Программа настраивается через файл конфигурации форматов TOML, JSON, YML и YAML. Так же можно настраивать через переменные среды, которые будут считаться первичными.

### Секции файла конфигурации

- **logger** - настрока логгера (переменная среды: CRON_EXTEND_LOGGER)
- **logger.output** - (переменная среды: CRON_EXTEND_LOGGER_OUTPUT)
- **api** - активация API сервера (переменная среды: CRON_EXTEND_API)
- **manager** - настройки cron-manager (переменная среды: CRON_EXTEND_MANAGER)

### Пример файла конфигурации config.toml

```toml
[logger]
    levels = ["fatal","info","error","warn","debug","trace"]            # уровни логирования
    [logger.bindings]                                                   # дополнительные ключи
        key1 = "key1-val"
        key2 = "key2-val"
    [logger.output]                                                     # настройка отображения
        timestamp = "full"                                              # вывод времени full, short, unix и none
        levels = ["fatal","info","error","warn","debug","trace"]        # вывод типов
        bindings = "no-wrapper"                                         # отображение ключей square, bracket, none, no-wrapper

[api]
    enable = false              # активация API сервера
    hostname = "0.0.0.0"        # хост          
    port = 3001                 # порт
    backlog = 511               # очередь баклога
    prefix = "/api"             # префикс
    connection_timeout = 0      # таймаут сервера в милисекундах
    keep_alive_timeout = 5000   # таймаут keep-alive сервера в милисекундах
    body_limit = 1048576        # максимальный размер тела запроса в байтах
    trust_proxy = false         # доверие proxy закголовку

[manager]                       # настройки cron-manager
    jobs_path = "jobs"          # путь до папки задач
    tags = []                   # теги сервера
    [manager.env]               # дополнительные переменые среды
        CONFIG_ENV_KEY1 = "CONFIG_ENV_KEY1_VALUE"
        CONFIG_ENV_KEY2 = "CONFIG_ENV_KEY2_VALUE"
        CONFIG_ENV_KEY3 = "${CONFIG_ENV_KEY3}"
```

### Таблица параметров конфигурации

| Параметр | Тип | Значение | Описание |
| ----- | ----- | ----- | ----- |
| logger.levels | строка[] | "fatal","info","error","warn","debug","trace" | уровни логирования |
| logger.bindings | объект | {} | дополнительные ключи |
| logger.output.timestamp | строка | full | вывод времени full, short, unix и none |
| logger.output.levels | строка[] | "fatal","info","error","warn","debug","trace" | вывод типов |
| logger.output.bindings | строка | no-wrapper | отображение ключей square, bracket, none, no-wrapper |
| api.enable | логический | false | активация API сервера |
| api.hostname | строка | 0.0.0.0 | хост |
| api.port | число | 3001 | порт |
| api.backlog | число | 511 | очередь баклога |
| api.prefix | строка | /api | префикс |
| api.connection_timeout | число | 0 | таймаут сервера в милисекундах |
| api.keep_alive_timeout | число | 5000 | таймаут keep-alive сервера в милисекундах |
| api.body_limit | число | 1048576 | максимальный размер тела запроса в байтах |
| api.trust_proxy | логический | false | доверие proxy закголовку |
| manager.jobs_path | строка | jobs | путь до папки задач |
| manager.tags | строка[] | [] | теги сервера |
| manager.env | объект | {} | дополнительные переменые среды |

### Настройка через переменные среды

Ключи конфигурации можно задать через переменные среды ОС. Имя переменной среды формируется из двух частей, префикса `CRON_EXTEND_` и имени переменной в верхнем реестре. Если переменная вложена, то это обозначается символом `_`. Переменные среды имеют высший приоритет.

пример для переменной **api.enable**: `CRON_EXTEND_API_ENABLE`

## <a name="jobs"></a> Настройка задач

Задачи настраиваются через файл конфигурации форматов TOML, JSON, YML и YAML. Папка с задачами настраивается в секции файла настройки **manager**

### Пример файла конфигурации job.toml

```toml
enable = true                       # активация задачи
description = "job description"     # описание задачи
timeout = 60                        # таймаут выполнения в секундах
tags = []                           # теги для запуска
cwd = "cwd_folder"                  # рабочая папка
command = "executer"                # команда запуска
args = [                            # аргументы
    "arg1",
    "arg2",
    "arg3"
]
[env]                               # дополнительные переменые среды
    JOB_KEY1 = "JOB_KEY1_VALUE"
    JOB_KEY2 = "JOB_KEY2_VALUE"
    JOB_KEY3 = "${JOB_ENV_KEY3}"
[cron]                              # настройка крона
    interval = "1 * * * * *"        # интервал
    time_zone = "Europe/Moscow"     # временая зона
```

## <a name="api"></a> API

Сервис предоставляет API, который настраивается в секции файла настройки **api**. API доступно по протоколу HTTP.

### Примеры применения

проверить доступность сервера: `curl -i http://localhost:3001/api/healthcheck` или `curl -i http://localhost:3001/api/`  

### API информации сервиса

| URL | Метод | Код | Описание | Пример ответа/запроса |
| ----- | ----- | ----- | ----- | ----- |
| / | GET | 200 | проверить здоровье сервиса | OK |
| /healthcheck | GET | 200 | проверить здоровье сервиса | OK |
| /v1/info | GET | 200 | получить информацию по задачам | [пример](#v1_info) |
| /v1/status | GET | 200 | получить только статус по задачам | [пример](#v1_status) |

## Примеры ответов/запросов

### Базовый ответ провала

Этот ответ возвращается при отказе выполнения запроса. Пример:

```js
{
    "status": "fail",
    "message": "Причина отказа"
}
```

### Базовый ответ ошибки

Этот ответ возвращается при ошибке на сервере. Пример:

```js
{
    "status": "error",
    "message": "Причина ошибки"
}
```

### <a name="v1_info"></a> Получить информацию по задачам: /v1/info

```js
[
    {
        "enable": false,
        "description": "description job1.yml",
        "command": "empty",
        "timeout": 60,
        "tags": [],
        "cwd": "C:\\progs\\cron-extend",
        "args": [],
        "env": {
            "CONFIG_ENV_KEY1": "CONFIG_ENV_KEY1_VALUE",
            "CONFIG_ENV_KEY2": "CONFIG_ENV_KEY2_VALUE",
            "CONFIG_ENV_KEY3": "CONFIG_ENV_KEY3_VALUE"
        },
        "cron": {
            "interval": "1 * * * * *",
            "time_zone": "Europe/Moscow"
        },
        "executing": false,
        "id": "job1.json",
        "error": false,
        "error_message": ""
    },
    {
        "enable": true,
        "description": "json job 2",
        "timeout": 60,
        "tags": [],
        "cwd": "C:\\progs\\cron-extend",
        "command": "1",
        "args": [],
        "env": {
            "JOB_KEY1": "JOB_KEY1_VALUE",
            "JOB_KEY2": "JOB_KEY2_VALUE",
            "JOB_KEY3": "JOB_ENV_KEY3_VALUE",
            "CONFIG_ENV_KEY1": "CONFIG_ENV_KEY1_VALUE",
            "CONFIG_ENV_KEY2": "CONFIG_ENV_KEY2_VALUE",
            "CONFIG_ENV_KEY3": "CONFIG_ENV_KEY3_VALUE"
        },
        "cron": {
            "interval": "1 * * * * *",
            "time_zone": "Europe/Moscow"
        },
        "executing": false,
        "id": "job2.toml",
        "error": true,
        "error_message": "Error: spawn 1 ENOENT"
    }
]
```

### <a name="v1_status"></a> Получить только статус по задачам: /v1/status

```js
[
    {
        "id": "job1.json",
        "enable": false,
        "description": "description job1.yml",
        "executing": false,
        "error": false,
        "error_message": ""
    },
    {
        "id": "job2.toml",
        "enable": true,
        "description": "json job 2",
        "executing": false,
        "error": true,
        "error_message": "Error: spawn 1 ENOENT"
    }
]
```
