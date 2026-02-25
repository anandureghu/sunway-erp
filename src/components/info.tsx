const Info = ({ title, subtitle }: { title: string; subtitle: string }) => {
  return (
    <div>
      <p className="text-gray-500 font-semibold">{subtitle ?? ""}</p>
      <h4 className="font-medium">{title ?? "-"}</h4>
    </div>
  );
};

export default Info;
