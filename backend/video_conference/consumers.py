import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)

class VideoConferenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'video_conference_{self.room_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f"WebSocket connected: {self.room_id}")

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket disconnected: {self.room_id}, code: {close_code}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        # Log the received message
        logger.debug(f"Received message: {message_type} in room {self.room_id}")
        
        # Handle different message types
        if message_type == 'join':
            await self.handle_join(data)
        elif message_type == 'leave':
            await self.handle_leave(data)
        elif message_type == 'offer':
            await self.handle_offer(data)
        elif message_type == 'answer':
            await self.handle_answer(data)
        elif message_type == 'ice-candidate':
            await self.handle_ice_candidate(data)
        elif message_type == 'chat-message':
            await self.handle_chat_message(data)
        elif message_type == 'screen-share-started':
            await self.handle_screen_share_started(data)
        elif message_type == 'screen-share-stopped':
            await self.handle_screen_share_stopped(data)
        elif message_type == 'media-state-change':
            await self.handle_media_state_change(data)
        else:
            logger.warning(f"Unknown message type: {message_type}")

    async def handle_join(self, data):
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'userId': data.get('userId'),
                'userName': data.get('userName'),
                'userAvatar': data.get('userAvatar')
            }
        )

    async def handle_leave(self, data):
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_left',
                'userId': data.get('userId')
            }
        )

    async def handle_offer(self, data):
        # Send offer to specific user
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_offer',
                'userId': data.get('userId'),
                'targetUserId': data.get('targetUserId'),
                'sdp': data.get('sdp')
            }
        )

    async def handle_answer(self, data):
        # Send answer to specific user
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_answer',
                'userId': data.get('userId'),
                'targetUserId': data.get('targetUserId'),
                'sdp': data.get('sdp')
            }
        )

    async def handle_ice_candidate(self, data):
        # Send ICE candidate to specific user
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_ice_candidate',
                'userId': data.get('userId'),
                'targetUserId': data.get('targetUserId'),
                'candidate': data.get('candidate')
            }
        )

    async def handle_chat_message(self, data):
        # Send chat message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'userId': data.get('userId'),
                'userName': data.get('userName'),
                'message': data.get('message'),
                'timestamp': data.get('timestamp')
            }
        )

    async def handle_screen_share_started(self, data):
        # Notify room that a user started screen sharing
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'screen_share_started',
                'userId': data.get('userId')
            }
        )

    async def handle_screen_share_stopped(self, data):
        # Notify room that a user stopped screen sharing
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'screen_share_stopped',
                'userId': data.get('userId')
            }
        )

    async def handle_media_state_change(self, data):
        # Notify room about media state change
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'media_state_change',
                'userId': data.get('userId'),
                'isCameraOn': data.get('isCameraOn'),
                'isMicOn': data.get('isMicOn')
            }
        )

    # Event handlers
    async def user_joined(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user-joined',
            'userId': event['userId'],
            'userName': event['userName'],
            'userAvatar': event['userAvatar']
        }))

    async def user_left(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user-left',
            'userId': event['userId']
        }))

    async def send_offer(self, event):
        # Send offer to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'offer',
            'userId': event['userId'],
            'targetUserId': event['targetUserId'],
            'sdp': event['sdp']
        }))

    async def send_answer(self, event):
        # Send answer to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'answer',
            'userId': event['userId'],
            'targetUserId': event['targetUserId'],
            'sdp': event['sdp']
        }))

    async def send_ice_candidate(self, event):
        # Send ICE candidate to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'ice-candidate',
            'userId': event['userId'],
            'targetUserId': event['targetUserId'],
            'candidate': event['candidate']
        }))

    async def chat_message(self, event):
        # Send chat message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat-message',
            'userId': event['userId'],
            'userName': event['userName'],
            'message': event['message'],
            'timestamp': event['timestamp']
        }))

    async def screen_share_started(self, event):
        # Send screen share started notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'screen-share-started',
            'userId': event['userId']
        }))

    async def screen_share_stopped(self, event):
        # Send screen share stopped notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'screen-share-stopped',
            'userId': event['userId']
        }))

    async def media_state_change(self, event):
        # Send media state change to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'media-state-change',
            'userId': event['userId'],
            'isCameraOn': event['isCameraOn'],
            'isMicOn': event['isMicOn']
        }))
