import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ШАПКА */}
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              UF
            </div>
            <span className="font-bold text-lg">Юнит-Фокус</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">Возможности</a>
            <a href="#marketplaces" className="hover:text-slate-900">Маркетплейсы</a>
            <a href="#how" className="hover:text-slate-900">Как работает</a>
          </nav>
          <Link
            href="/calculator"
            className="bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Открыть калькулятор
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          Бесплатно · Без регистрации
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Считайте <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">юнит-экономику</span><br />
          для Wildberries и Ozon
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Узнайте реальную прибыль с каждой продажи за 30 секунд.
          Все комиссии, логистика, налоги и реклама — в одном расчёте.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/calculator"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
          >
            Рассчитать бесплатно →
          </Link>
          <a
            href="#how"
            className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-8 py-4 rounded-xl text-lg transition"
          >
            Как это работает
          </a>
        </div>
      </section>

      {/* БОЛЬ */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Знакомая ситуация?</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Товар продаётся, выручка растёт, а денег почему-то нет
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📉', title: 'Кажется, что в плюсе', text: 'Продали на 100 000 ₽, а после комиссий, логистики и рекламы осталось 3 000 ₽' },
              { icon: '🤯', title: 'Комиссии меняются', text: 'WB и Ozon каждый месяц меняют тарифы. Не успеваете пересчитывать' },
              { icon: '🎯', title: 'Не знаете точку безубыточности', text: 'До какой цены можно участвовать в акции, чтобы не уйти в минус?' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ЧТО СЧИТАЕМ */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Что считает Юнит-Фокус</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Полный расчёт — от цены до чистой прибыли
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '💰', title: 'Чистая прибыль', text: 'С каждой единицы и со всей партии' },
              { icon: '📊', title: 'Маржа и ROI', text: 'Понятные проценты без бухгалтерии' },
              { icon: '⚖️', title: 'Точка безубыточности', text: 'Минимальная цена, чтобы не уйти в минус' },
              { icon: '🏷️', title: 'Максимальная скидка', text: 'Сколько можно скинуть под акцию' },
              { icon: '🚚', title: 'Все расходы', text: 'Комиссия, логистика, хранение, эквайринг' },
              { icon: '📢', title: 'Реклама', text: 'Учитываем стоимость продвижения' },
              { icon: '↩️', title: 'Возвраты', text: 'Сколько съедают возвраты и утилизация' },
              { icon: '🧾', title: 'Налоги', text: 'УСН, самозанятый, ОСНО — все режимы' },
            ].map((item) => (
              <div key={item.title} className="border border-slate-200 rounded-xl p-5 hover:border-blue-500 transition">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* МАРКЕТПЛЕЙСЫ */}
      <section id="marketplaces" className="bg-slate-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Поддерживаемые маркетплейсы</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8">
              <div className="text-2xl font-bold mb-2">Wildberries</div>
              <div className="text-purple-200 text-sm mb-6">Модель FBO</div>
              <ul className="space-y-2 text-sm">
                <li>✓ Комиссия по категории</li>
                <li>✓ Логистика и хранение</li>
                <li>✓ Эквайринг</li>
                <li>✓ Расчёт возвратов</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8">
              <div className="text-2xl font-bold mb-2">Ozon</div>
              <div className="text-blue-200 text-sm mb-6">Модель FBO</div>
              <ul className="space-y-2 text-sm">
                <li>✓ Комиссия по категории</li>
                <li>✓ Логистика по объёму</li>
                <li>✓ Последняя миля (5.5%)</li>
                <li>✓ Ozon Pay, утилизация</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-slate-400 text-sm mt-8">
            Яндекс.Маркет и Мегамаркет — в разработке
          </p>
        </div>
      </section>

      {/* КАК РАБОТАЕТ */}
      <section id="how" className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Как это работает</h2>
          <div className="space-y-8">
            {[
              { n: '1', title: 'Выберите маркетплейс', text: 'Wildberries или Ozon — переключение в один клик' },
              { n: '2', title: 'Введите данные товара', text: 'Цена, себестоимость, комиссия, логистика — всё уже подставлено по умолчанию' },
              { n: '3', title: 'Получите расчёт', text: 'Прибыль, маржа, ROI, точка безубыточности и максимальная скидка' },
            ].map((step) => (
              <div key={step.n} className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">{step.title}</h3>
                  <p className="text-slate-600">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Узнайте реальную прибыль прямо сейчас</h2>
          <p className="text-blue-100 mb-8">Бесплатно. Без регистрации. Без ограничений.</p>
          <Link
            href="/calculator"
            className="inline-block bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition"
          >
            Открыть калькулятор →
          </Link>
        </div>
      </section>

      {/* ФУТЕР */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div>© 2025 Юнит-Фокус. Юнит-экономика для маркетплейсов.</div>
          <div className="flex gap-6">
            <Link href="/calculator" className="hover:text-slate-900">Калькулятор</Link>
            <a href="#" className="hover:text-slate-900">Контакты</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
