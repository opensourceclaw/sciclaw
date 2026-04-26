"""
ResearchClaw WebSocket Endpoint
"""
import asyncio
import json
from typing import Dict, Set
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from starlette.websockets import WebSocketState

from web.api.auth import get_optional_api_key

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        # task_id -> set of websockets
        self.task_connections: Dict[str, Set[WebSocket]] = {}
        # websocket -> task_id
        self.connection_tasks: Dict[WebSocket, str] = {}
        # General connections (for broadcasting)
        self.general_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket, task_id: str = None):
        """Connect a websocket"""
        await websocket.accept()
        
        if task_id:
            if task_id not in self.task_connections:
                self.task_connections[task_id] = set()
            self.task_connections[task_id].add(websocket)
            self.connection_tasks[websocket] = task_id
        else:
            self.general_connections.add(websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect a websocket"""
        task_id = self.connection_tasks.pop(websocket, None)
        
        if task_id and task_id in self.task_connections:
            self.task_connections[task_id].discard(websocket)
            if not self.task_connections[task_id]:
                del self.task_connections[task_id]
        
        self.general_connections.discard(websocket)
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send message to a specific connection"""
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_json(message)
        except Exception:
            pass  # Connection may be closed
    
    async def broadcast_to_task(self, task_id: str, message: dict):
        """Broadcast message to all connections watching a task"""
        if task_id not in self.task_connections:
            return
        
        disconnected = set()
        for websocket in self.task_connections[task_id]:
            try:
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.send_json(message)
            except Exception:
                disconnected.add(websocket)
        
        # Clean up disconnected
        for ws in disconnected:
            self.disconnect(ws)
    
    async def broadcast_general(self, message: dict):
        """Broadcast to all general connections"""
        disconnected = set()
        for websocket in self.general_connections:
            try:
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.send_json(message)
            except Exception:
                disconnected.add(websocket)
        
        for ws in disconnected:
            self.disconnect(ws)
    
    @property
    def connection_count(self) -> int:
        """Total connection count"""
        return len(self.connection_tasks) + len(self.general_connections)


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates.
    
    Connect with optional task_id parameter to subscribe to specific task updates.
    
    Message format:
    {
        "type": "progress|status|error|result",
        "task_id": "...",
        "data": {...}
    }
    """
    task_id = None
    
    # Get task_id from query params
    # Note: In WebSocket, we need to parse manually or use query param access
    await websocket.accept()
    
    try:
        # Receive initial message with task_id
        try:
            initial_data = await asyncio.wait_for(
                websocket.receive_text(),
                timeout=10.0
            )
            data = json.loads(initial_data)
            task_id = data.get("task_id")
        except asyncio.TimeoutError:
            task_id = None
        except json.JSONDecodeError:
            task_id = None
        
        # Connect
        await manager.connect(websocket, task_id)
        
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "task_id": task_id,
            "message": "Connected to ResearchClaw WebSocket"
        })
        
        # Handle incoming messages
        while True:
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=60.0  # Heartbeat timeout
                )
                
                # Parse and handle command
                try:
                    message = json.loads(data)
                    cmd = message.get("type")
                    
                    if cmd == "ping":
                        await websocket.send_json({"type": "pong"})
                    elif cmd == "subscribe":
                        # Subscribe to a task
                        new_task_id = message.get("task_id")
                        if new_task_id:
                            # Disconnect from old task if any
                            old_task_id = manager.connection_tasks.get(websocket)
                            if old_task_id and old_task_id in manager.task_connections:
                                manager.task_connections[old_task_id].discard(websocket)
                            
                            # Connect to new task
                            if new_task_id not in manager.task_connections:
                                manager.task_connections[new_task_id] = set()
                            manager.task_connections[new_task_id].add(websocket)
                            manager.connection_tasks[websocket] = new_task_id
                            
                            await websocket.send_json({
                                "type": "subscribed",
                                "task_id": new_task_id
                            })
                    elif cmd == "unsubscribe":
                        task_id = manager.connection_tasks.pop(websocket, None)
                        if task_id and task_id in manager.task_connections:
                            manager.task_connections[task_id].discard(websocket)
                        await websocket.send_json({"type": "unsubscribed"})
                            
                except json.JSONDecodeError:
                    pass
                    
            except asyncio.TimeoutError:
                # Send ping
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    break
            except WebSocketDisconnect:
                break
                
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)


@router.websocket("/ws/{task_id}")
async def websocket_task_endpoint(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint for specific task updates.
    """
    await manager.connect(websocket, task_id)
    
    try:
        # Send initial status
        await websocket.send_json({
            "type": "connected",
            "task_id": task_id,
            "message": f"Connected to task {task_id}"
        })
        
        # Keep connection alive
        while True:
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=60.0
                )
                
                # Echo back for confirmation
                await websocket.send_json({
                    "type": "received",
                    "data": data
                })
                
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})
            except WebSocketDisconnect:
                break
                
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)
