import { CloseIcon, BookmarkIcon } from './icons';

interface TopBarProps {
  onClose?: () => void;
  onBookmark?: () => void;
}

/** Minimal overlay header: close (left) and save (right). */
export function TopBar({ onClose, onBookmark }: TopBarProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-6 text-ink">
      <button type="button" aria-label="Close" onClick={onClose} className="p-1">
        <CloseIcon className="h-6 w-6" />
      </button>
      <button type="button" aria-label="Save to wishlist" onClick={onBookmark} className="p-1">
        <BookmarkIcon className="h-6 w-6" />
      </button>
    </header>
  );
}
