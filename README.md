# cc-statusline

Полезный status line для Claude Code (анти-Kickbacks): остаток контекста, и режим
🐱 **claudegochi** — тамагочи, чьё настроение = состояние сессии.

## Установка одной строкой

Требуется Node.js, git и Claude Code CLI. Вставь команду — клонирует и поставит само.

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/denipesto/cc-statusline/main/install.ps1 | iex
```

**macOS / Linux / Git Bash:**
```sh
curl -fsSL https://raw.githubusercontent.com/denipesto/cc-statusline/main/install.sh | sh
```

Bootstrap клонирует репозиторий в `~/.cc-statusline` и запускает установщик.
После — **перезапусти Claude Code**.

### Вручную (клон + установщик)

```sh
git clone https://github.com/denipesto/cc-statusline.git
cd cc-statusline
node bin/install.mjs
```

Установщик сам впишет `statusLine` в `~/.claude/settings.json` с **абсолютными путями
к node и скрипту** (вычисляются от места клонирования — PATH не важен, папка может быть
где угодно), сделает бэкап `settings.json.bak` и не тронет остальной конфиг.

Из папки проекта то же самое: `npm run setup`.

После установки **перезапусти Claude Code** (закрыть/открыть терминал).

### Варианты

```sh
node bin/install.mjs --mode tamagotchi   # установить и сразу включить кота
node bin/install.mjs --mode normal       # установить в режиме бара контекста
node bin/install.mjs --uninstall         # убрать statusLine из settings.json
```

(`npm run remove` = `--uninstall`.)

## Настройка — `config.json`

Перечитывается на каждом рендере, перезапуск не нужен.

| Поле | Значения | Что делает |
|---|---|---|
| `mode` | `"normal"` \| `"tamagotchi"` | режим |
| `widgets` | `["context", ...]` | какие виджеты и порядок (для normal) |
| `petStyle` | `"sprite"` \| `"compact"` | кот 3 строки / 1 строка |
| `petName` | строка | имя питомца |
| `contextWindow` | `null` \| число | окно контекста (`null` = авто: 200k / 1M для `[1m]`) |
| `separator` | строка | разделитель виджетов |

## Разработка

```sh
npm run demo    # показать кота во всех настроениях (синтетические фикстуры)
```

Идеи и бэклог — в [IDEAS.md](./IDEAS.md).
