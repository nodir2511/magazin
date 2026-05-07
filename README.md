# magazin

Статический сайт для учета магазина с Supabase как backend.

## Локальный запуск

Создайте локальный `config.js` рядом с `index.html`:

```js
window.STORE_SUPABASE = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-public-key'
};
```

Потом откройте `index.html` в браузере.

## Деплой на Vercel

1. Загрузите проект на GitHub.
2. В Vercel выберите `Add New -> Project` и импортируйте репозиторий.
3. Добавьте переменные окружения в `Settings -> Environment Variables`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

4. Нажмите `Deploy`.

Vercel использует `npm run build`, собирает файлы в `dist/` и создает `config.js` из переменных окружения.

## Supabase

Перед использованием примените `supabase-schema.sql` в SQL Editor вашего Supabase проекта и задеплойте Edge Functions из папки `supabase/functions`.
