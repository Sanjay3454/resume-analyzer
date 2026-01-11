import { usePuterStore } from "~/lib/puter";
import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router";

export const meta = () => ([
    { title: 'Resumind | Sign In' },
    { name: 'description', content: 'Log into your account' },
]);

const Auth = () => {
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const next = location.search.split('next=')[1] || '/';
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.isAuthenticated) navigate(next);
    }, [auth.isAuthenticated, next, navigate]);

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex justify-center">
                    <span className="text-3xl font-bold tracking-tight text-slate-900">RESUMIND</span>
                </Link>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Or <Link to="/" className="font-medium text-brand-600 hover:text-brand-500">return to home</Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10 border border-slate-200">
                    <div className="space-y-6">
                        {isLoading ? (
                            <button disabled className="btn btn-primary w-full opacity-75 cursor-not-allowed">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Connecting...
                            </button>
                        ) : (
                            <>
                                {auth.isAuthenticated ? (
                                    <button
                                        className="btn btn-secondary w-full"
                                        onClick={auth.signOut}
                                    >
                                        Sign out
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary w-full justify-center text-lg"
                                        onClick={auth.signIn}
                                    >
                                        Sign in with Puter
                                    </button>
                                )}
                            </>
                        )}

                        {!auth.isAuthenticated && (
                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-white px-2 text-slate-500">Secure access via Puter.com</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Auth;
