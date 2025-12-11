import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { History, Settings, Users, Shield, Database, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  owner_user_id: string;
  action_type: string;
  action_description: string;
  target_table: string | null;
  target_id: string | null;
  old_value: any;
  new_value: any;
  created_at: string;
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'setting_update':
      return <Settings className="w-4 h-4" />;
    case 'role_update':
      return <Users className="w-4 h-4" />;
    case 'security_change':
      return <Shield className="w-4 h-4" />;
    default:
      return <Database className="w-4 h-4" />;
  }
};

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case 'setting_update':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'role_update':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'security_change':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'application_update':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const OwnerAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('owner_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Card className="glass-effect border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Owner Audit Log
          </CardTitle>
          <CardDescription>
            Track all actions performed in the Owner Panel
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs yet</p>
              <p className="text-sm">Actions will be recorded here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getActionColor(log.action_type)}`}>
                        {getActionIcon(log.action_type)}
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{log.action_description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {log.action_type.replace('_', ' ')}
                          </Badge>
                          {log.target_table && (
                            <span>• {log.target_table}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                      {(log.old_value || log.new_value) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        >
                          {expandedLog === log.id ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {expandedLog === log.id && (log.old_value || log.new_value) && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                      {log.old_value && (
                        <div className="text-xs">
                          <span className="text-red-400 font-medium">Old Value:</span>
                          <pre className="mt-1 p-2 bg-red-500/10 rounded text-red-300 overflow-x-auto">
                            {JSON.stringify(log.old_value, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_value && (
                        <div className="text-xs">
                          <span className="text-green-400 font-medium">New Value:</span>
                          <pre className="mt-1 p-2 bg-green-500/10 rounded text-green-300 overflow-x-auto">
                            {JSON.stringify(log.new_value, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
