import React from "react";

export const DrawerWorkflowStep = ({ workflows, setWorkflows }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Configure Approvers
      </h3>

      {workflows.map((workflow, index) => (
        <div key={index} className="p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Workflow {index + 1}</h4>
            {workflows.length > 1 && (
              <button
                onClick={() =>
                  setWorkflows(workflows.filter((_, i) => i !== index))
                }
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Initiator Data
              </label>
              <input
                type="text"
                value={workflow.initiator}
                onChange={(e) => {
                  const newWorkflows = [...workflows];
                  newWorkflows[index].initiator = e.target.value;
                  setWorkflows(newWorkflows);
                }}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="Enter initiator name/email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Applicant Data
              </label>
              <input
                type="text"
                value={workflow.applicant}
                onChange={(e) => {
                  const newWorkflows = [...workflows];
                  newWorkflows[index].applicant = e.target.value;
                  setWorkflows(newWorkflows);
                }}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="Enter applicant name/email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Approvers Data
              </label>
              <input
                type="text"
                value={workflow.approvers}
                onChange={(e) => {
                  const newWorkflows = [...workflows];
                  newWorkflows[index].approvers = e.target.value;
                  setWorkflows(newWorkflows);
                }}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="Enter approver names/emails (comma separated)"
              />
            </div>
          </div>
        </div>
      ))}

      {workflows.length < 3 && (
        <button
          onClick={() =>
            setWorkflows([
              ...workflows,
              { initiator: "", applicant: "", approvers: "" },
            ])
          }
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition"
        >
          + Add Workflow
        </button>
      )}
    </div>
  );
};
