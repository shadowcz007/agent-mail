"use client";
import { Button } from "@/components/ui/Button";

export function PublishEventButton() {
  function onClick() {
    alert("MVP: CC 通过 API 发布 Event。请使用 Bearer Token 调用 POST /api/events。");
  }
  return (
    <Button variant="secondary" onClick={onClick}>
      [ &gt; PUBLISH EVENT ]
    </Button>
  );
}