import React, { useState } from "react";
import { useTranslation } from "react-i18next";

function Dropdown({ title, children, index, openIndex, setOpenIndex }) {
  const isOpen = index === openIndex;

  const handleClick = () => {
    setOpenIndex(isOpen ? null : index);
  };

  return (
    <div className="w-[90%]  m-2 mx-10 flex flex-col items-start justify-start">
      <button
        onClick={handleClick}
        className="hover:bg-shit hover:bg-opacity-60 flex flex-row items-center justify-center text-black font-bold py-2 px-4 rounded m-2"
      >
        <p className="text-shit text-3xl px-2 -mt-1">{isOpen ? "‒" : "+"}</p>
        {title}
      </button>
      <div
        className={`overflow-hidden transition-all text-left ${
          isOpen ? "max-h-96 my-2  text-shit font-semibold" : "max-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Rules() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <div className="pt-28 flex flex-col items-start justify-start">
      <p className="text-3xl font-bold font-oswald p-1 md:ml-28 md:m-5 text-back">
        {t("rules_title")}
      </p>
      <div className="bg-back">
        <Dropdown
          title={t("rules_q1_title")}
          index={0}
          openIndex={openIndex}
          setOpenIndex={setOpenIndex}
        >
          <ul className="p-4">
            <li>{t("rules_q1_a1")}</li>
            <li>{t("rules_q1_a2")}</li>
            <li>{t("rules_q1_a3")}</li>
          </ul>
        </Dropdown>
        <Dropdown
          title={t("rules_q2_title")}
          index={1}
          openIndex={openIndex}
          setOpenIndex={setOpenIndex}
        >
          <ul className="p-4">
            <li>{t("rules_q2_a1")}</li>
          </ul>
        </Dropdown>
        <Dropdown
          title={t("rules_q3_title")}
          index={2}
          openIndex={openIndex}
          setOpenIndex={setOpenIndex}
        >
          <ul className="p-4">
            <li>{t("rules_q3_a1")}</li>
            <li>{t("rules_q3_a2")}</li>
            <li>{t("rules_q3_a3")}</li>
            <li>{t("rules_q3_a4")}</li>
          </ul>
        </Dropdown>
        <Dropdown
          title={t("rules_q4_title")}
          index={3}
          openIndex={openIndex}
          setOpenIndex={setOpenIndex}
        >
          <ul className="p-4">
            <li>{t("rules_q4_a1")}</li>
          </ul>
        </Dropdown>
        <Dropdown
          title={t("rules_q5_title")}
          index={4}
          openIndex={openIndex}
          setOpenIndex={setOpenIndex}
        >
          <ul className="p-4">
            <li>{t("rules_q5_a1")}</li>
          </ul>
        </Dropdown>
        <Dropdown
          title={t("rules_q6_title")}
          index={5}
          openIndex={openIndex}
          setOpenIndex={setOpenIndex}
        >
          <ul className="p-4">
            <li>{t("rules_q6_a1")}</li>
          </ul>
        </Dropdown>
        <Dropdown
          title={t("rules_q7_title")}
          index={7}
          openIndex={openIndex}
          setOpenIndex={setOpenIndex}
        >
          <ul className="p-4 text-left">
            <li>{t("rules_q7_a1")}</li>
            <li>{t("rules_q7_a2")}</li>
            <li>{t("rules_q7_a3")}</li>
            <li>{t("rules_q7_a4")}</li>
            <li>{t("rules_q7_a5")}</li>
            <li>{t("rules_q7_a6")}</li>
            <li>{t("rules_q7_a7")}</li>
            <li>{t("rules_q7_a8")}</li>
            <li>{t("rules_q7_a9")}</li>
            <li>{t("rules_q7_a10")}</li>
            <li>{t("rules_q7_a11")}</li>
            <li>{t("rules_q7_a12")}</li>
          </ul>
        </Dropdown>
        <Dropdown
          title={t("rules_q8_title")}
          index={8}
          openIndex={openIndex}
          setOpenIndex={setOpenIndex}
        >
          <ul className="p-4">
            <li>{t("rules_q8_a1")}</li>
            <li>{t("rules_q8_a2")}</li>
          </ul>
        </Dropdown>
        <Dropdown
          title={t("rules_q9_title")}
          index={9}
          openIndex={openIndex}
          setOpenIndex={setOpenIndex}
        >
          <ul className="p-4">
            <li>{t("rules_q9_a1")}</li>
            <li>{t("rules_q9_a2")}</li>
            <li>{t("rules_q9_a3")}</li>
            <li>{t("rules_q9_a4")}</li>
            <li>{t("rules_q9_a5")}</li>
            <li>{t("rules_q9_a6")}</li>
          </ul>
        </Dropdown>
      </div>

      <p className="text-3xl font-bold font-oswald p-5">
        {t("rules_office_address_title")}
      </p>
      <div className="w-screen flex justify-center items-center py-10">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d340.7203155078027!2d24.026883168975875!3d49.846646527820226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473add0ccfd9e63f%3A0xc15e4a8be7be479c!2sVesela%20St%2C%205%2C%20L&#39;viv%2C%20L&#39;vivs&#39;ka%20oblast%2C%2079000!5e0!3m2!1sen!2sua!4v1714400834628!5m2!1sen!2sua"
          className="w-[90vw]"
          height="450"
          style={{ border: "0" }}
          allowfullscreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
}

export default Rules;
