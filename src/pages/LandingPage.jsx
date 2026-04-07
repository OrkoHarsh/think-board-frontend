import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2">
                    <div className="text-blue-600 dark:text-blue-400">
                        <svg
                            width="50"
                            height="50"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M18.5 12C18.5 7.85786 15.1421 4.5 11 4.5C7.29339 4.5 4.21523 7.23662 3.58875 10.8041C1.56494 11.3967 0 13.3626 0 15.5C0 18.5376 2.46243 21 5.5 21H18.5C21.5376 21 24 18.5376 24 15.5C24 12.4624 21.5376 10 18.5 10V12Z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                        ThinkBoard
                    </h1>
                </div>

                {/* Headline */}
                <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                    Collaborate in real time
                    <br />
                    with your team
                </h2>

                {/* CTA Button */}
                <div className="pt-4">
                    <Link
                        to="/signup"
                        className="w-full block bg-blue-600 dark:bg-blue-700 text-white text-lg font-medium py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm"
                    >
                        Sign up
                    </Link>
                </div>

                {/* Login Link */}
                <div className="text-gray-900 dark:text-gray-200">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
