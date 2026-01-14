import React from "react";
import ApartmentCard from "./ApartmentCard";

function ApartmentsGrid({ apartments }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {(apartments || []).map((apt, idx) => {
        const key =
          apt?._id?.$oid ??
          apt?.wdid ??
          apt?.globalId ??
          apt?.wubid ??
          `${apt?.name || "apt"}-${idx}`;

        return <ApartmentCard key={key} apartment={apt} />;
      })}
    </div>
  );
}

export default ApartmentsGrid;
