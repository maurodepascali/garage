export const Layout = ({ children }) => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <main>{children}</main>
      </div>
    );
  };