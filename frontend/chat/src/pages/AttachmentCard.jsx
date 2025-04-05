import { DocumentIcon } from '@heroicons/react/24/outline';

export default function AttachmentCard({ attachment, onDelete, isDeleting, disableDelete = true }) {
    let fileUrl = "https://backend.bahwebdev.com" + attachment.file.slice(21);
    fileUrl = fileUrl.replace(".comdev","")
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.file);
    const isVideo = /\.(mp4|webm|mov)$/i.test(attachment.file);

    return (
        <div className="relative group border rounded-lg overflow-hidden h-40">
            {isImage ? (
                <img
                    src={fileUrl}
                    alt="Attachment"
                    className="w-full h-full object-cover"
                />
            ) : isVideo ? (
                <video
                    src={fileUrl}
                    className="w-full h-full object-cover"
                    controls
                />
            ) : (
                <div className="p-4 bg-gray-100 h-full flex flex-col items-center justify-center">
                    <DocumentIcon className="h-10 w-10 text-gray-400" />
                    <span className="mt-2 text-xs text-gray-500 text-center truncate w-full px-2">
                        {attachment.file.split('/').pop()}
                    </span>
                </div>
            )}

            {/* Only show delete button if not disabled */}
            {!disableDelete && (
                <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className={`absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full ${
                        isDeleting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } transition-opacity`}
                >
                    {isDeleting ? (
                        <span className="text-xs">Deleting...</span>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
}
