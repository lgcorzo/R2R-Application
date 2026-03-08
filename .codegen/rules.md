# Autonomous Multi-Agent Development System

## Execution Mode
- **Mode**: autonomous_multi_agent
- **Auto-spawn agents**: ENABLED
- **Max concurrent agents**: 10
- **Max nesting depth**: 5
- **Require approval**: DISABLED
- **Continue until complete**: ENABLED
- **Self-healing**: ENABLED

## Agent Autonomy
- **Level**: MAXIMUM
- **Auto-decide**: true
- **Confidence threshold**: 0.6
- Ask human ONLY for: architectural breaking changes, data loss risk

## Sub-Agent Creation Rules
ВСЕГДА создавай специализированных агентов для:
- Задач средней и высокой сложности
- Параллельной работы
- Специализированных навыков (тестирование, review, рефакторинг)

### Available Agent Types
1. **analyzer** - анализ требований и кода
2. **implementer** - написание кода
3. **tester** - тестирование
4. **reviewer** - code review
5. **debugger** - поиск и исправление багов
6. **refactorer** - рефакторинг
7. **documenter** - документация

## Autonomous Workflow

### 1. Self-Assign Task
- Автоматически назначай себя на задачи с labels: bug, enhancement, refactor, tests-needed
- Создавай feature branch сразу

### 2. Deep Analysis
- Spawn agent: analyzer
- Анализируй: codebase, документацию, похожие issues, зависимости

### 3. Decompose to Subtasks
- Разбивай сложные задачи на подзадачи
- Автоматически создавай sub-issues в Linear
- Сразу назначай на агентов

### 4. Parallel Implementation
- Spawn implementer agents (столько, сколько нужно)
- Агенты координируются автономно
- Работают параллельно

### 5. Continuous Testing
- Spawn tester agent в фоне
- При падении тестов - автоматически чинить
- Loop until green

### 6. Self-Review
- Spawn reviewer agent
- Автоматически запрашивай исправления
- Auto-fix review comments
- Loop until all resolved

### 7. Create PR
- Auto-request human reviewers
- НО: auto-merge DISABLED (требуется human approval)

### 8. Monitor and Iterate
- На CI failure: auto-fix and retry
- На review comments: auto-address
- Max 10 iterations

## Bug Fix Workflow
1. Spawn debugger → create reproduction test
2. Root cause analysis с debugger/profiler/trace
3. Generate 3 parallel fix variants (spawn 3 implementers)
4. Evaluate and auto-select best solution
5. Apply and loop until tests green

## Proactive Improvement (Daily)
- Сканируй codebase на code smells, performance issues, security vulnerabilities
- Автоматически создавай issues в Linear
- Для low-risk improvements: сразу реализуй и создавай PR

## Communication Rules
- Язык: русский
- Обновляй статус только при: milestone completed, blocked, error after retry
- Логируй все решения в `.codegen/decisions/`

## Safety Limits
- Auto-merge: DISABLED
- Protected files: .env*, *.key, *.pem
- Max files per PR: 200
- Max lines changed: 5000
- Max execution time: 2h
- Max cost per task: $10

## Learning System
- Учись на: successful patterns, failed attempts, review feedback
- Обновляй `.codegen/learned-patterns.md`
- Применяй выученное к будущим задачам

## КРИТИЧЕСКИ ВАЖНО
- НЕ ждать подтверждений (кроме auto-merge)
- НЕ останавливаться на ошибках - чинить и продолжать
- НЕ создавать одиночные PRы - доводить до конца
- ВСЕГДА работать до полного completion
- ВСЕГДА создавать специализированных агентов для сложных задач
