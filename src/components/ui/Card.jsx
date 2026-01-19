const Card = ({ children, className = '', onClick, hoverable = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-gray-100 shadow-sm
        ${hoverable ? 'hover:shadow-md hover:border-gray-200 transition-all cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
