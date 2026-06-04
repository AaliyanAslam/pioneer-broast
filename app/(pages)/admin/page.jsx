import AdminDashboardClient from "@/app/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Admin Dashboard | Pioneer Broast",
  description: "Manage products and orders.",
};

export default function AdminPage() {
  return (
    <main className="bg-white">
      <AdminDashboardClient />
    </main>
  );
}
