import { Link } from 'react-router-dom';

const BoardCard = ({ board }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Link to={`/board/${board.id}`} className="block group">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden h-full flex flex-col">
                {/* Preview Area */}
                <div className="h-40 bg-gray-50 dark:bg-gray-700 flex items-center justify-center p-6 border-b border-gray-100 dark:border-gray-600">
                    {board.previewType === 'sticky' ? (
                        <div className="w-32 h-24 bg-yellow-200 rounded shadow-sm transform -rotate-1 flex items-center justify-center p-2 text-center">
                            <span className="text-xs font-handwriting text-gray-700">Welcome Email</span>
                        </div>
                    ) : (
                        <div className="w-32 h-24 bg-blue-200 rounded shadow-sm transform rotate-1"></div>
                    )}
                </div>

                {/* Content Area */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {board.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(board.updatedAt)}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default BoardCard;
