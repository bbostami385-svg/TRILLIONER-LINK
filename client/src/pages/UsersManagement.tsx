import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Search, Filter, Download } from "lucide-react";

interface User {
  id: number;
  email: string | null;
  name?: string | null;
  role: "admin" | "user";
  createdAt: Date;
  isVerified?: boolean;
  profileImage?: string | null;
}

export function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "unverified">("all");

  // Fetch all users
  const { data: users = [], isLoading } = trpc.users.getAllUsers.useQuery({
    limit: 1000,
  });

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter((user: User) => {
      // Search filter
      const matchesSearch =
        (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      // Verification filter
      const matchesVerification =
        verificationFilter === "all" ||
        (verificationFilter === "verified" && user.isVerified) ||
        (verificationFilter === "unverified" && !user.isVerified);

      return matchesSearch && matchesRole && matchesVerification;
    });
  }, [users, searchQuery, roleFilter, verificationFilter]);

  const handleExportCSV = () => {
    const headers = ["ID", "Email", "Username", "Role", "Verified", "Created At"];
    const rows = filteredUsers.map((user: User) => [
      user.id,
      user.email || "N/A",
      user.name || "N/A",
      user.role,
      user.isVerified ? "Yes" : "No",
      new Date(user.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any[]) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Users Management</h1>
          <p className="text-purple-200">Search and manage all users in the system</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 p-6 bg-slate-800 border-purple-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-purple-200 mb-2">
                <Search className="inline w-4 h-4 mr-2" />
                Search Users
              </label>
              <Input
                placeholder="Search by email or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-700 border-purple-500 text-white placeholder:text-slate-400"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                <Filter className="inline w-4 h-4 mr-2" />
                Role
              </label>
              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger className="bg-slate-700 border-purple-500 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-purple-500">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verification Filter */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Verification Status
              </label>
              <Select
                value={verificationFilter}
                onValueChange={(value: any) => setVerificationFilter(value)}
              >
                <SelectTrigger className="bg-slate-700 border-purple-500 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-purple-500">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleExportCSV}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </Button>
          </div>
        </Card>

        {/* Results Summary */}
        <Card className="mb-6 p-4 bg-slate-800 border-purple-500">
          <p className="text-purple-200">
            Showing <span className="font-bold text-white">{filteredUsers.length}</span> of{" "}
            <span className="font-bold text-white">{users.length}</span> users
          </p>
        </Card>

        {/* Users Table */}
        <Card className="bg-slate-800 border-purple-500 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-purple-200">Loading users...</div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-700/50">
                  <TableRow className="border-purple-500/30 hover:bg-transparent">
                    <TableHead className="text-purple-200">ID</TableHead>
                    <TableHead className="text-purple-200">Email</TableHead>
                    <TableHead className="text-purple-200">Username</TableHead>
                    <TableHead className="text-purple-200">Role</TableHead>
                    <TableHead className="text-purple-200">Verified</TableHead>
                    <TableHead className="text-purple-200">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow
                      key={user.id}
                      className="border-purple-500/20 hover:bg-slate-700/50 transition-colors"
                    >
                      <TableCell className="text-slate-300">{user.id}</TableCell>
                      <TableCell className="text-slate-300">{user.email || "N/A"}</TableCell>
                      <TableCell className="text-slate-300">
                        {user.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.isVerified
                              ? "bg-green-500/20 text-green-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {user.isVerified ? "✓ Yes" : "✗ No"}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center text-purple-200">
              No users found matching your filters
            </div>
          )}
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="p-6 bg-slate-800 border-purple-500">
            <div className="text-center">
              <p className="text-purple-200 text-sm mb-2">Total Users</p>
              <p className="text-4xl font-bold text-white">{users.length}</p>
            </div>
          </Card>
          <Card className="p-6 bg-slate-800 border-purple-500">
            <div className="text-center">
              <p className="text-purple-200 text-sm mb-2">Admins</p>
              <p className="text-4xl font-bold text-red-400">
                {users.filter((u: User) => u.role === "admin").length}
              </p>
            </div>
          </Card>
          <Card className="p-6 bg-slate-800 border-purple-500">
            <div className="text-center">
              <p className="text-purple-200 text-sm mb-2">Verified Users</p>
              <p className="text-4xl font-bold text-green-400">
                {users.filter((u: User) => u.isVerified).length}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
