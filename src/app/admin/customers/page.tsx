import { snapshot } from "@/lib/desk";

export default function CustomersPage() {
  const { desk } = snapshot();
  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Customers</h1>
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Bookings</th></tr></thead>
        <tbody>
          {desk.users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{desk.bookings.filter((item) => item.email === user.email).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
