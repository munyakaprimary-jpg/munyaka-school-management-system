"export const Button = ({ children, className, ...props }: any) => {
  return (
    <button className={className} {...props}>
      <span className="bg-blue-600 text-white py-2 px-4 rounded-2xl flex items-center">
        <FileIcon size={16} className="mr-2" />
        <span className="text-sm font-medium">{children}</span>
      </span>
    </button>
  );
};