class CalendarService:
    def get_authorization_url(self):
        # Placeholder for Google OAuth URL generation
        return "https://accounts.google.com/o/oauth2/auth?..."

    def exchange_code_for_token(self, code: str):
        # Placeholder for token exchange
        return {"access_token": "mock_token", "refresh_token": "mock_refresh"}

    def create_event(self, token_data: dict, event: dict):
        # Placeholder for event creation
        return {"id": "mock_event_id", "status": "confirmed"}

calendar_service = CalendarService()