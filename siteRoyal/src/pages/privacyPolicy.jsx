import React from "react";

function BookingPolicy() {
  return (
    <main className="bg-brand-black pt-16">
      <section className="mx-auto w-full bg-[#F6F0EA] max-w-[1100px] px-6 py-14 text-left">
        <h1 className="font-finlandica text-[34px] sm:text-[44px] font-extrabold uppercase leading-[1.1] text-[#1b1b1b]">
          Політика бронювання апартаментів у Львові
        </h1>

        <p className="mt-6 max-w-[900px] text-[14px] leading-[1.8] text-[#1b1b1b]/75">
          Ця сторінка описує правила бронювання, оплати, заселення та скасування
          бронювань для апартаментів у Львові. Оформлюючи бронювання на сайті,
          ви погоджуєтесь з умовами нижче.
        </p>

        <div className="mt-10 grid gap-10">
          {/* 1 */}
          <div>
            <h2 className="font-finlandica text-[18px] sm:text-[20px] font-extrabold uppercase tracking-[0.08em] text-[#1b1b1b]">
              1. Як працює бронювання
            </h2>
            <ul className="mt-4 list-disc pl-6 text-[14px] leading-[1.9] text-[#1b1b1b]/75">
              <li>
                Ви обираєте апартаменти, дати та кількість гостей і надсилаєте
                запит на бронювання.
              </li>
              <li>
                Після підтвердження доступності ми надсилаємо деталі оплати та
                інструкції щодо заселення.
              </li>
              <li>
                Бронювання вважається підтвердженим після отримання оплати (або
                передоплати), якщо інше не узгоджено.
              </li>
            </ul>
          </div>

          {/* 2 */}
          <div>
            <h2 className="font-finlandica text-[18px] sm:text-[20px] font-extrabold uppercase tracking-[0.08em] text-[#1b1b1b]">
              2. Оплата та передоплата
            </h2>
            <p className="mt-4 text-[14px] leading-[1.9] text-[#1b1b1b]/75">
              Умови оплати можуть залежати від сезону, кількості ночей та типу
              тарифу. Зазвичай використовується:
            </p>
            <ul className="mt-3 list-disc pl-6 text-[14px] leading-[1.9] text-[#1b1b1b]/75">
              <li>передоплата для гарантії бронювання;</li>
              <li>доплата при заселенні або до заселення (за домовленістю);</li>
              <li>
                застава/депозит у випадках, коли це передбачено правилами.
              </li>
            </ul>
          </div>

          {/* 3 */}
          <div>
            <h2 className="font-finlandica text-[18px] sm:text-[20px] font-extrabold uppercase tracking-[0.08em] text-[#1b1b1b]">
              3. Заселення та виселення
            </h2>
            <ul className="mt-4 list-disc pl-6 text-[14px] leading-[1.9] text-[#1b1b1b]/75">
              <li>
                Час заселення та виселення вказується в підтвердженні
                бронювання.
              </li>
              <li>
                Раннє заселення / пізній виїзд можливі за наявності та можуть
                бути платними.
              </li>
              <li>
                Для заселення може знадобитися документ, що посвідчує особу.
              </li>
            </ul>
          </div>

          {/* 4 */}
          <div>
            <h2 className="font-finlandica text-[18px] sm:text-[20px] font-extrabold uppercase tracking-[0.08em] text-[#1b1b1b]">
              4. Скасування бронювання та повернення коштів
            </h2>
            <p className="mt-4 text-[14px] leading-[1.9] text-[#1b1b1b]/75">
              Політика скасування залежить від тарифу
              (гнучкий/стандартний/неповертаємий). У загальному випадку:
            </p>
            <ul className="mt-3 list-disc pl-6 text-[14px] leading-[1.9] text-[#1b1b1b]/75">
              <li>
                при скасуванні завчасно — можливе часткове або повне повернення;
              </li>
              <li>
                при скасуванні в короткий термін до заїзду — передоплата може не
                повертатися;
              </li>
              <li>
                у разі незаїзду (no-show) — оплата може утримуватись згідно
                тарифу.
              </li>
            </ul>
            <p className="mt-3 text-[14px] leading-[1.9] text-[#1b1b1b]/75">
              Точні умови для вашого бронювання вказуються під час оформлення та
              в підтвердженні.
            </p>
          </div>

          {/* 5 */}
          <div>
            <h2 className="font-finlandica text-[18px] sm:text-[20px] font-extrabold uppercase tracking-[0.08em] text-[#1b1b1b]">
              5. Правила проживання
            </h2>
            <ul className="mt-4 list-disc pl-6 text-[14px] leading-[1.9] text-[#1b1b1b]/75">
              <li>Дотримуйтеся тиші у нічний час та правил будинку.</li>
              <li>Кількість гостей має відповідати бронюванню.</li>
              <li>
                Паління в апартаментах заборонене (якщо не зазначено інше).
              </li>
              <li>
                Домашні тварини — лише за погодженням (якщо дозволено у
                конкретних апартаментах).
              </li>
            </ul>
          </div>

          {/* 6 */}
          <div>
            <h2 className="font-finlandica text-[18px] sm:text-[20px] font-extrabold uppercase tracking-[0.08em] text-[#1b1b1b]">
              6. Відповідальність та безпека
            </h2>
            <p className="mt-4 text-[14px] leading-[1.9] text-[#1b1b1b]/75">
              Гість несе відповідальність за збереження майна та дотримання
              правил проживання. У разі пошкоджень може бути утриманий депозит
              або стягнена компенсація за фактичними збитками.
            </p>
          </div>

          {/* 7 */}
          <div>
            <h2 className="font-finlandica text-[18px] sm:text-[20px] font-extrabold uppercase tracking-[0.08em] text-[#1b1b1b]">
              7. Контакти
            </h2>
            <p className="mt-4 text-[14px] leading-[1.9] text-[#1b1b1b]/75">
              Якщо маєте питання щодо бронювання або умов проживання — напишіть
              нам або зателефонуйте. Контакти доступні на сторінці “Зв’язатися з
              нами”.
            </p>
          </div>

          <div className="pt-4 text-[12px] text-[#1b1b1b]/55">
            Оновлено: {new Date().toLocaleDateString("uk-UA")}
          </div>
        </div>
      </section>
    </main>
  );
}

export default BookingPolicy;
