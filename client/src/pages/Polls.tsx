import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function Polls() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    postId: 0,
    question: "",
    options: ["", ""],
  });

  const createPollMutation = trpc.polls.createPoll.useMutation();
  const votePollMutation = trpc.polls.votePoll.useMutation();

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validOptions = formData.options.filter((opt) => opt.trim().length > 0);
      if (validOptions.length < 2) {
        alert("Please provide at least 2 options");
        return;
      }

      await createPollMutation.mutateAsync(
        {
          postId: formData.postId,
          question: formData.question,
          options: validOptions,
        },
        {
          onSuccess: () => {
            setFormData({
              postId: 0,
              question: "",
              options: ["", ""],
            });
            setShowCreateForm(false);
          },
          onError: (error) => {
            alert(`Error: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.error("Failed to create poll:", error);
    }
  };

  const handleVote = async (optionId: number) => {
    try {
      await votePollMutation.mutateAsync(
        { optionId },
        {
          onSuccess: () => {
            alert("Vote recorded!");
          },
          onError: (error) => {
            alert(`Error: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const handleAddOption = () => {
    if (formData.options.length < 4) {
      setFormData({
        ...formData,
        options: [...formData.options, ""],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData({
        ...formData,
        options: formData.options.filter((_, i) => i !== index),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Polls</h1>
          <p className="text-purple-200">Create and participate in polls</p>
        </div>

        {/* Create Poll Button */}
        {user && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {showCreateForm ? "Cancel" : "Create Poll"}
          </Button>
        )}

        {/* Create Poll Form */}
        {showCreateForm && (
          <Card className="mb-8 p-6 bg-slate-800 border-purple-500">
            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Post ID</label>
                <Input
                  type="number"
                  value={formData.postId}
                  onChange={(e) => setFormData({ ...formData, postId: parseInt(e.target.value) })}
                  placeholder="Enter post ID"
                  className="bg-slate-700 border-purple-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Question</label>
                <Input
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter poll question"
                  className="bg-slate-700 border-purple-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Options</label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index] = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        placeholder={`Option ${index + 1}`}
                        className="bg-slate-700 border-purple-500 text-white flex-1"
                      />
                      {formData.options.length > 2 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {formData.options.length < 4 && (
                  <Button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-2 bg-slate-700 hover:bg-slate-600"
                  >
                    Add Option
                  </Button>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={createPollMutation.isPending}
              >
                {createPollMutation.isPending ? "Creating..." : "Create Poll"}
              </Button>
            </form>
          </Card>
        )}

        {/* Info */}
        <Card className="p-6 bg-slate-800 border-purple-500">
          <h2 className="text-2xl font-bold text-white mb-4">About Polls</h2>
          <div className="space-y-3 text-purple-200">
            <p>
              <strong>Create Polls:</strong> Add polls to your posts to gather opinions from your audience.
            </p>
            <p>
              <strong>Vote:</strong> Participate in polls created by others by selecting your preferred option.
            </p>
            <p>
              <strong>Options:</strong> Each poll can have 2-4 options for voting.
            </p>
            <p>
              <strong>Real-time Results:</strong> See vote counts and percentages as people participate.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
