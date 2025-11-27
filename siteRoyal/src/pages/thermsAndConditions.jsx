import React from "react";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-mainC py-28 px-6">
      <div className="max-w-5xl mx-auto bg-back shadow-xl rounded-2xl p-10 border border-gray-100">
        <h1 className="text-4xl font-extrabold text-center text-amber-600 mb-8 tracking-wide">
          Правила та умови користування сайтом
        </h1>

        <p className="text-gray-700 mb-6 text-lg leading-relaxed">
          Вітаємо вас на сайті{" "}
          <span className="font-semibold text-amber-600">Royal Apart</span> —
          сервісі подобової оренди апартаментів у Львові. Використовуючи наш
          сайт і оформлюючи бронювання, ви погоджуєтесь із наведеними нижче
          правилами.
        </p>

        {/* --- 1. Загальні положення --- */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-amber-500 mb-3">
            1. Загальні положення
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
            <li>
              Сайт <span className="font-medium">Royal Apart</span> створений
              для ознайомлення користувачів з доступними апартаментами та
              можливістю онлайн-бронювання.
            </li>
            <li>
              Ми надаємо точну та актуальну інформацію, проте залишаємо за собою
              право оновлювати ціни, фото чи опис без попередження.
            </li>
            <li>
              Використання сайту можливе лише з метою законного бронювання
              житла.
            </li>
          </ul>
        </section>

        {/* --- 2. Умови бронювання --- */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-amber-500 mb-3">
            2. Умови бронювання та оплати
          </h2>
          <p className="text-gray-700 mb-3 leading-relaxed">
            Процес бронювання здійснюється через наш онлайн-модуль. Після
            оформлення заявки адміністрація зв’яжеться з вами для підтвердження
            броні. Остаточне бронювання вважається дійсним після внесення
            передоплати.
          </p>
          <ul className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Передоплата гарантує закріплення апартаментів за клієнтом.</li>
          </ul>
        </section>

        {/* --- 3. Заселення та проживання --- */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-amber-500 mb-3">
            3. Заселення, проживання та виселення
          </h2>
          <p className="text-gray-700 mb-3 leading-relaxed">
            Заселення можливе після 14:00, виселення — до 11:00. При заселенні
            необхідно мати дійсний документ, що посвідчує особу.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              Гість несе відповідальність за збереження майна апартаментів під
              час проживання.
            </li>
            <li>
              У приміщеннях заборонено куріння, розпивання алкоголю у великих
              кількостях, шум після 22:00.
            </li>
            <li>
              За порушення правил адміністрація має право відмовити у подальшому
              проживанні без компенсації.
            </li>
          </ul>
        </section>

        {/* --- 4. Політика конфіденційності --- */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-amber-500 mb-3">
            4. Конфіденційність та обробка персональних даних
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Ми поважаємо конфіденційність наших гостей. Усі надані дані (ім’я,
            телефон, електронна адреса) використовуються виключно для бронювання
            та не передаються третім особам без вашої згоди.
          </p>
        </section>

        {/* --- 5. Відповідальність сторін --- */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-amber-500 mb-3">
            5. Відповідальність сторін
          </h2>
          <p className="text-gray-700 mb-3 leading-relaxed">
            Ми прагнемо забезпечити комфортні умови для кожного гостя, однак не
            несемо відповідальності за:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>збої у роботі сайту або тимчасову відсутність доступу;</li>
            <li>дії користувачів, що виходять за межі правил проживання;</li>
            <li>
              помилки, пов’язані з некоректним введенням контактних даних.
            </li>
          </ul>
        </section>

        {/* --- 6. Зміни до умов --- */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-amber-500 mb-3">
            6. Зміни та оновлення правил
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Ми залишаємо за собою право змінювати ці умови без попереднього
            повідомлення. Оновлена версія завжди доступна на цій сторінці.
          </p>
        </section>

        {/* --- 7. Надавачі послуг --- */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-amber-500 mb-3">
            7. Надавачі послуг
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Надання послуг з розміщення здійснюється наступними суб’єктами
            господарювання:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
            <li>ФОП Химочка С-Л. А.</li>
            <li>ФОП Уманець Д.Б.</li>
            <li>ФОП Семчишин Р.В.</li>
            <li>ФОП Шев'як О.В.</li>
            <li>ФОП Дмитрик К.В.</li>
            <li>ФОП Шев'як М.М.</li>
            <li>ТзОВ "Арісто ІНС"</li>
            <li>ФОП Пецкович В.І</li>
          </ul>
        </section>

        {/* --- Підпис --- */}
        <div className="text-center mt-10 text-sm text-gray-600">
          Останнє оновлення: {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
