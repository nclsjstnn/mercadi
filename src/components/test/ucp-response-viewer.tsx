"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CopyButton } from "@/components/platform/copy-button";
import { ChevronRight, Globe } from "lucide-react";

interface UCPExchange {
  function: string;
  args: unknown;
  result: unknown;
}

export default function UCPResponseViewer({
  exchanges,
}: {
  exchanges: UCPExchange[];
}) {
  if (exchanges.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Globe className="h-3 w-3" />
        UCP Exchanges ({exchanges.length})
      </p>
      {exchanges.map((ex, i) => (
        <Collapsible key={i}>
          <CollapsibleTrigger className="flex w-full items-center gap-1 rounded border bg-background/50 px-2 py-1.5 text-xs font-mono hover:bg-background">
            <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-90" />
            {ex.function}()
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1 space-y-1.5 pl-4 text-xs">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">Request</span>
                  <CopyButton value={JSON.stringify(ex.args, null, 2)} />
                </div>
                <pre className="overflow-auto rounded bg-background p-2 text-[11px]">
                  {JSON.stringify(ex.args, null, 2)}
                </pre>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">Response</span>
                  <CopyButton value={JSON.stringify(ex.result, null, 2)} />
                </div>
                <pre className="overflow-auto rounded bg-background p-2 text-[11px]">
                  {JSON.stringify(ex.result, null, 2)}
                </pre>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
