# История изменений

## 2026-05-28

- Добавлены явные `GRANT` в `supabase-schema.sql` для таблиц `store_state`, `user_roles`, `store_changes`, чтобы проект был готов к новым правилам Supabase Data API.
- Перед изменениями Supabase был сделан SQL-экспорт данных.
- Усилена Edge Function `create-user`: теперь при ошибке записи роли новый Auth-пользователь не остается без роли, а ошибка возвращается понятнее.
- Edge Function `create-user` задеплоена в Supabase.
- Удалены служебные файлы Windows `desktop.ini`; добавлено правило `desktop.ini` в `.gitignore`.
- В таблицу "История прихода" добавлена колонка "Сумма" (`кол-во * цена`).
- Добавлен простой логотип `Magazin` на страницу входа и в шапку приложения.
- Проверена локальная сборка через `npm run build`.
- Изменения закоммичены и отправлены в GitHub: `3f80ff0 Update store app and Supabase access`.
