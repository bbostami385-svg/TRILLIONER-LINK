import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function Groups() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });

  const { data: userGroups, isLoading: loadingGroups } = trpc.groups.getUserGroups.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: searchResults } = trpc.groups.searchGroups.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const createGroupMutation = trpc.groups.createGroup.useMutation();
  const joinGroupMutation = trpc.groups.joinGroup.useMutation();

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGroupMutation.mutateAsync(formData);
      setFormData({ name: "", description: "", isPrivate: false });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      await joinGroupMutation.mutateAsync({ groupId });
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Groups</h1>
          <p className="text-purple-200">Join communities and connect with people</p>
        </div>

        {/* Create Group Button */}
        {user && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {showCreateForm ? "Cancel" : "Create Group"}
          </Button>
        )}

        {/* Create Group Form */}
        {showCreateForm && (
          <Card className="mb-8 p-6 bg-slate-800 border-purple-500">
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Group Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter group name"
                  className="bg-slate-700 border-purple-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter group description"
                  className="w-full bg-slate-700 border border-purple-500 text-white rounded p-2"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-purple-200">Private Group</label>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </form>
          </Card>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups..."
            className="bg-slate-800 border-purple-500 text-white"
          />
        </div>

        {/* Your Groups */}
        {user && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Your Groups</h2>
            {loadingGroups ? (
              <p className="text-purple-200">Loading groups...</p>
            ) : userGroups && userGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userGroups.map((group) => (
                  <Card
                    key={group.id}
                    className="p-4 bg-slate-800 border-purple-500 hover:border-pink-500 transition-colors cursor-pointer"
                  >
                    <h3 className="text-lg font-bold text-white mb-2">{group.name}</h3>
                    <p className="text-purple-200 text-sm mb-3">{group.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-purple-300">{group.memberCount} members</span>
                      <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded">
                        {group.isPrivate ? "Private" : "Public"}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-purple-200">You haven't joined any groups yet</p>
            )}
          </div>
        )}

        {/* Search Results */}
        {searchResults && searchResults.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((group) => (
                <Card
                  key={group.id}
                  className="p-4 bg-slate-800 border-purple-500 hover:border-pink-500 transition-colors"
                >
                  <h3 className="text-lg font-bold text-white mb-2">{group.name}</h3>
                  <p className="text-purple-200 text-sm mb-3">{group.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-purple-300">{group.memberCount} members</span>
                    <Button
                      onClick={() => handleJoinGroup(group.id)}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                      disabled={joinGroupMutation.isPending}
                    >
                      Join
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
