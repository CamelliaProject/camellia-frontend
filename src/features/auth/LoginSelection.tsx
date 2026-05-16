import { Link } from 'react-router-dom';

export default function LoginSelection() {
  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-4 py-10">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#1B4332] mb-4">Choose your login type</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Camellia separates visitors, plantation administrators, and super administrators.
            Pick the right portal for your role.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link
            to="/tourist/login"
            className="rounded-3xl border border-gray-200 p-8 text-center hover:shadow-lg transition"
          >
            <p className="text-xl font-semibold text-[#2D6A4F] mb-3">Tourist</p>
            <p className="text-gray-600">Browse plantations, book experiences, and view your dashboard.</p>
          </Link>

          <Link
            to="/plantation-admin/login"
            className="rounded-3xl border border-gray-200 p-8 text-center hover:shadow-lg transition"
          >
            <p className="text-xl font-semibold text-[#2D6A4F] mb-3">Plantation Admin</p>
            <p className="text-gray-600">Manage a plantation, replies, and bookings for your site.</p>
          </Link>

          <Link
            to="/super-admin/login"
            className="rounded-3xl border border-gray-200 p-8 text-center hover:shadow-lg transition"
          >
            <p className="text-xl font-semibold text-[#2D6A4F] mb-3">Super Admin</p>
            <p className="text-gray-600">Approve registrations, manage plantations, and review requests.</p>
          </Link>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/plantation-request"
            className="inline-flex items-center justify-center rounded-full bg-[#2D6A4F] px-8 py-3 text-white font-semibold hover:bg-[#1B4332] transition"
          >
            Register a Plantation
          </Link>
        </div>
      </div>
    </div>
  );
}
