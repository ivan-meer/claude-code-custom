# Feature Specification: VibeChat Terminal UI

**Feature Branch**: `001-vibechat-terminal-ui`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Разработать VibeChat — enhanced terminal UI для Claude Code с системой нотификаций Full Debug (tool use, thinking blocks, subagents, token counts, timing, model switches, permission requests) и WebSocket-based архитектурой. Пользователь видит live state в statusline и историю в scrollable log. Основа для будущего веб-GUI."

## User Scenarios & Testing

### User Story 1 - Receive Full Debug Notifications (Priority: P1)

Пользователь запускает Claude Code и видит в реальном времени уведомления о действиях агентов (использование инструментов, мыслительные блоки, запуск субагентов, токены, время, переключение моделей, запросы разрешений). Эти уведомления отображаются в statusline (текущее состояние) и в прокручиваемом логе (история).

**Why this priority**: Core value proposition; provides transparency into agent operations, crucial for "vibe-coder" learning and debugging. Establishes foundation for future web GUI.

**Independent Test**: Запуск простой задачи (например, `ls` или `grep`) и верификация, что все типы уведомлений Full Debug корректно отображаются в statusline и логе.

**Acceptance Scenarios**:

1. **Given** Claude Code запущен в режиме Full Debug, **When** агент начинает думать, **Then** в statusline появляется соответствующее сообщение "Thinking...", и запись добавляется в лог.
2. **Given** агент использует инструмент (например, `Bash`), **When** инструмент запускается, **Then** в statusline появляется сообщение "Tool: Bash executing...", и запись добавляется в лог с деталями команды.
3. **Given** агент запускает субагента, **When** субагент активирован, **Then** в statusline появляется сообщение "Subagent: [SubagentName] active...", и запись добавляется в лог.
4. **Given** агент запрашивает разрешение (например, на выполнение `Bash` команды), **When** запрос сделан, **Then** в statusline появляется сообщение "Permission request: Bash...", и запись добавляется в лог.
5. **Given** процесс генерации ответа, **When** используется определенное количество токенов, **Then** в statusline и логе отображается информация о расходе токенов.
6. **Given** происходит переключение модели ИИ, **When** модель меняется, **Then** в statusline и логе отображается информация о смене модели.

---

### User Story 2 - Configure Notification Filters (Priority: P2)

Пользователь может настраивать, какие типы уведомлений Full Debug (tool use, thinking blocks, subagents и т.д.) отображать в UI. По умолчанию отображаются все уведомления.

**Why this priority**: Enhances usability, reduces noise for experienced users, allows focus on relevant information. Important for long-term user satisfaction.

**Independent Test**: Изменение настроек фильтрации (например, отключение "token counts") и запуск задачи. Проверка, что отключенные уведомления не отображаются, а включенные - отображаются.

**Acceptance Scenarios**:

1. **Given** пользователь хочет скрыть уведомления о расходе токенов, **When** он отключает "token counts" через интерфейс, **Then** информация о токенах перестает отображаться в statusline и логе.
2. **Given** пользователь хочет снова видеть все уведомления, **When** он включает все фильтры, **Then** все типы уведомлений отображаются.

---

### User Story 3 - Real-time Statusline Updates (Priority: P1)

Statusline в нижней части терминала динамически обновляется, показывая текущее состояние агента (мысли, используемые инструменты, активные субагенты), используя анимацию/изменения.

**Why this priority**: Provides immediate feedback and a sense of "liveness" for the user, improving perceived responsiveness and engagement.

**Independent Test**: Наблюдение за statusline во время выполнения различных операций Claude Code. Проверка, что статус оперативно меняется и отражает текущее действие агента.

**Acceptance Scenarios**:

1. **Given** агент находится в состоянии "Thinking", **When** его статус меняется на "Executing Bash command", **Then** statusline мгновенно обновляется, отражая новое состояние.
2. **Given** длительная операция, **When** агент периодически обновляет свой "статус/мысль", **Then** statusline показывает эти промежуточные состояния.

---

### User Story 4 - Scrollable Log History (Priority: P1)

Все уведомления Full Debug, отображаемые в statusline, также сохраняются в прокручиваемом логе выше statusline, формируя полную историю взаимодействия.

**Why this priority**: Essential for reviewing past actions, debugging, and understanding agent behavior over time. Provides context for learning.

**Independent Test**: Выполнение серии операций Claude Code и проверка, что лог содержит полную и хронологически корректную историю всех уведомлений.

**Acceptance Scenarios**:

1. **Given** несколько операций завершены, **When** пользователь прокручивает лог, **Then** он видит полную историю всех уведомлений Full Debug от начала сессии.
2. **Given** длинный вывод лога, **When** пользователь может легко прокручивать его вверх и вниз, **Then** навигация по истории взаимодействия удобна.

---

### Edge Cases

- **Что происходит, когда WebSocket соединение прерывается?** Система должна gracefully обрабатывать отключения, возможно, уведомляя пользователя и пытаясь переподключиться.
- **Как система обрабатывает большой объем уведомлений (флуд)?** Должен быть механизм буферизации или агрегации, чтобы UI не перегружался и оставался отзывчивым.
- **Что происходит при ошибках во время выполнения хуков?** Ошибки должны логироваться, но не блокировать работу Claude Code или UI.

## Requirements

### Functional Requirements

- **FR-001**: Система MUST интегрироваться с хуками Claude Code (PostToolUse, Stop, PreToolUse, Notification, MessageDisplay) для перехвата событий.
- **FR-002**: Система MUST запускать WebSocket-сервер для потоковой передачи событий UI.
- **FR-003**: Система MUST отображать текущее состояние агента (Full Debug: tool use, thinking blocks, subagents, token counts, timing, model switches, permission requests) в statusline.
- **FR-004**: Система MUST записывать все уведомления Full Debug в прокручиваемый лог.
- **FR-005**: Система MUST предоставлять интерфейс для включения/отключения каждого типа уведомлений Full Debug.
- **FR-006**: Система MUST по умолчанию отображать все типы уведомлений.
- **FR-007**: Система MUST использовать адаптивный дизайн для отображения в терминале (statusline, прокручиваемый лог).
- **FR-008**: Система MUST обеспечивать плавное обновление statusline без мерцания.
- **FR-009**: Система MUST поддерживать протокол WebSocket для коммуникации.
- **FR-010**: Система MUST быть расширяемой для интеграции с будущим веб-GUI.

### Key Entities

- **AgentEvent**: Тип события, генерируемый Claude Code (ToolUse, ThinkingBlock, SubagentSpawn, TokenCount, ModelSwitch, PermissionRequest, MessageDisplay).
- **NotificationFilter**: Настройка пользователя для каждого типа AgentEvent (включено/отключено).
- **SessionState**: Текущее состояние Claude Code, включая активного агента, последнюю мысль, выполняемый инструмент.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% событий Full Debug (tool use, thinking blocks, subagents, token counts, timing, model switches, permission requests) перехватываются и корректно отображаются в UI.
- **SC-002**: Statusline обновляется в течение 100 мс после генерации события.
- **SC-003**: Пользователи могут включить/отключить любой тип уведомлений за <3 действия.
- **SC-004**: Лог остается прокручиваемым и отзывчивым при >1000 записей событий.
- **SC-005**: Пропускная способность WebSocket-сервера позволяет обрабатывать >100 событий/секунду без заметных задержек в UI.
- **SC-006**: Пользователи сообщают о повышении прозрачности работы Claude Code на 80% (качественная метрика через опросы).

## Assumptions

- **Пользователи имеют:** Стабильное сетевое соединение для WebSocket.
- **Claude Code:** Предоставляет необходимые хуки для перехвата всех указанных событий Full Debug.
- **Конфигурация:** Настройки фильтрации уведомлений хранятся локально (например, в файле конфигурации или памяти сессии).
- **Терминал:** Пользовательский терминал поддерживает отображение динамического statusline и прокручиваемого лога (псевдографика, ansi-коды).
- **Масштаб:** Для MVP не требуется поддержка множественных одновременных пользователей или сложных механизмов аутентификации для WebSocket-сервера.
- **Веб-GUI:** Будущий веб-GUI будет использовать тот же WebSocket-сервер для получения событий.
