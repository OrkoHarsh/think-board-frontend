import React, { useState } from 'react';

const AskNimbusModal = ({ isOpen, onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onGenerate(prompt);
        setPrompt('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-indigo-600">✨ Ask ThinkBoard AI</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <textarea
                        className="w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500"
                        rows="4"
                        placeholder="Describe what you want to add to the board..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        autoFocus
                    ></textarea>

                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm"
                        >
                            Generate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AskNimbusModal;
