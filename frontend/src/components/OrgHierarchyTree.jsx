import React, { useState } from 'react';
import { ChevronDown, ChevronRight, User, Users, Shield, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TreeNode = ({ node, level = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const { user: currentUser } = useAuth();
  const hasChildren = node.subordinates && node.subordinates.length > 0;
  const isMe = currentUser?.id === node.id;

  const roleStyles = {
    ADMIN: {
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: <Shield className="w-3.5 h-3.5 text-purple-700" />,
      border: 'border-purple-200'
    },
    MANAGER: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Users className="w-3.5 h-3.5 text-blue-700" />,
      border: 'border-blue-200'
    },
    EMPLOYEE: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <User className="w-3.5 h-3.5 text-emerald-700" />,
      border: 'border-emerald-200'
    },
  }[node.role] || {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: <User className="w-3.5 h-3.5 text-slate-500" />,
    border: 'border-slate-200'
  };

  return (
    <div className="relative">
      <div className={`flex items-center gap-3 p-3 my-1.5 rounded-xl border bg-white shadow-xs transition-all ${isMe ? 'ring-2 ring-blue-500 bg-blue-50/40 border-blue-300' : 'border-slate-200'} hover:bg-slate-50`}>
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-6"></div>
        )}

        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          {roleStyles.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-800 truncate">{node.full_name}</span>
            {isMe && (
              <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-300 px-1.5 py-0.2 rounded font-bold">YOU</span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">{node.email}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {hasChildren && (
            <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 font-mono">
              <Users className="w-3 h-3 text-slate-500" />
              {node.subordinates.length} direct
            </span>
          )}
          <span className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${roleStyles.badge}`}>
            {node.role}
          </span>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="ml-6 pl-4 border-l-2 border-slate-300 space-y-1">
          {node.subordinates.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const OrgHierarchyTree = ({ treeData }) => {
  if (!treeData || treeData.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
        No hierarchy nodes found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {treeData.map((rootNode) => (
        <TreeNode key={rootNode.id} node={rootNode} level={0} />
      ))}
    </div>
  );
};

export default OrgHierarchyTree;
