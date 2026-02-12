import React from "react";
import { useSelector } from "react-redux";
import ApartmentsGrid from "../../components2/home/apartmentsBlock/ApartmentsGrid";
import ApartmentsHeader from "../../components2/home/apartmentsBlock/ApartmentsHeader";
import SEO from "../../components/utils/SEO";
import { useApartmentsFiltering } from "../../components2/home/apartmentsBlock/useApartmentsFiltering"; // adjust path
import Pagination from "../../components2/home/apartmentsBlock/Pagination";
export default function Aparts() {
  const apartments = useSelector((s) => s.apartStore.apartments) || [];

  const {
    roomsOptions,
    floorsOptions,
    guestsOptions,
    visible,
    page,
    totalPages,
    setPage,
    filter,
    setFilter,
    query,
    setQuery,
    clearQuery,
  } = useApartmentsFiltering(apartments);

  return (
    <main className="bg-black text-brand-black">
      <SEO
        title="Квартири у Львові | Royal Apart"
        description="Перелік квартир у Львові, доступних для оренди. Виберіть зручну квартиру для вашого відпочинку."
        path="/aparts"
      />

      <div className="pt-[68px]">
        <section className="bg-white">
          <div className="mx-auto w-full max-w-[1320px] px-6 pb-16 pt-10">
            <ApartmentsHeader
              roomsOptions={roomsOptions}
              floorsOptions={floorsOptions}
              guestsOptions={guestsOptions}
              filter={filter}
              setFilter={setFilter}
              showSearch
              searchValue={query}
              onSearchChange={setQuery}
              onSearchClear={clearQuery}
            />

            <ApartmentsGrid apartments={visible} />

            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        </section>
      </div>
    </main>
  );
}
