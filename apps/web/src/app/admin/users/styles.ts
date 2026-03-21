export interface AdminUser {
  id: number;
  username: string;
  email: string;
  notifyOnOrder: boolean;
  createdAt: string;
}

export const inputClass =
  'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';

export const btnClass =
  'px-4 py-2 bg-gallery-accent text-gallery-black font-medium rounded-lg hover:bg-gallery-accent-light transition-colors disabled:opacity-50';
