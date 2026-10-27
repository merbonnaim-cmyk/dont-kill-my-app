# Qalbiah — система производства контента

## Структура
```
CLAUDE.md                                   постоянные правила проекта
.claude/agents/                             6 субагентов
  islamic-researcher.md   — проверка фактов, аятов, хадисов
  english-adapter.md      — перевод и культурная адаптация
  scriptwriter.md         — кинематографический сценарий
  visual-director.md      — сцены, continuity, промпты Seedance 2.5
  youtube-strategist.md   — заголовки, описание, обложки, ключевые слова
  quality-reviewer.md     — контроль качества, вердикт PASS / NEEDS_REVISION
.claude/skills/qalbiah-production/SKILL.md  главный конвейер (8 этапов)
qalbiah/style-guide.md                      утверждённый стиль канала (меняет только владелец)
qalbiah/input/                              исходные транскрипции — ТОЛЬКО ЧТЕНИЕ
qalbiah/input/examples/test-yunus-fa.txt    тестовая транскрипция (фарси)
qalbiah/projects/<дата>-<slug>/             результаты каждого запуска
```

## Запуск
1. Положите транскрипцию в `qalbiah/input/` (например, `qalbiah/input/story-ibrahim-fa.txt`).
2. В Claude Code в корне репозитория:
   ```
   /qalbiah-production qalbiah/input/story-ibrahim-fa.txt shorts
   ```
   Формат: `shorts` (9:16), `long` (16:9) или `both`. Без формата координатор предложит его сам.
   Можно также вставить текст транскрипции прямо после команды.
3. Результат: `qalbiah/projects/<дата>-<slug>/FINAL-PACKAGE.md` + промежуточные файлы каждого агента.

## Тест системы
```
/qalbiah-production qalbiah/input/examples/test-yunus-fa.txt shorts
```
Что должно произойти (признаки исправной работы):
- `02-research.md`: Коран 21:87–88, 37:139–148, 10:98, 68:48–50 — ✅; хадис о дуа Зун-Нуна (at-Tirmidhi) — с оценкой и грейдером;
  «40 дней в рыбе» — 🟡 (в источниках разные сроки, Коран срок не называет); «рыбе велено не ломать кости» и
  «жребий бросали три раза» — 🟠/⚪ (предания тафсира), а не ✅.
- `04-script.md`: эти детали поданы с оговоркой или исключены; приветствие и «лайкните» исходного канала не перенесены.
- `05-visuals.md`: все промпты 9:16, у Юнуса (мир ему) нет видимого лица.
- `06-youtube.md`: нет выдуманных объёмов поиска; в описании есть Sources и AI-дисклеймер.
- `07-review-r*.md`: вердикт и, при необходимости, второй раунд.
- Файл `qalbiah/input/examples/test-yunus-fa.txt` не изменён (`git diff` пустой).

Отдельного агента можно вызвать и вручную, например: «Используй агента islamic-researcher, чтобы проверить файл …».
