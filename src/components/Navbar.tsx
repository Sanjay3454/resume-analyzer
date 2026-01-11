import { Link } from "react-router";

const Navbar = () => {
    return (
        <nav className="border-b border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center">
                        <span className="text-xl font-bold tracking-tight text-slate-900">RESUMIND</span>
                    </Link>
                    <Link to="/upload" className="btn btn-primary">
                        Upload Resume
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
