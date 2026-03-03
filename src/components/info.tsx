const Info = ({ title, subtitle }: { title: string; subtitle: string }) => {
  return (
    <div>
      <p className="text-gray-500 font-medium text-sm">{subtitle ?? ""}</p>
      <h4 className="font-semibold">{title ?? "-"}</h4>
    </div>
  );
};

export default Info;
