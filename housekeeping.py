import schedule
import time
import threading

def cleanup_database():
    """Perform regular database maintenance"""
    db = next(get_db())
    try:
        # Close positions that have been sold
        # This finds buy positions where the entire quantity has been sold
        # and marks them as closed
        sold_positions = db.execute("""
            WITH position_sums AS (
                SELECT 
                    symbol,
                    user_id,
                    SUM(CASE WHEN side = 'buy' THEN quantity ELSE -quantity END) AS net_quantity
                FROM trades
                GROUP BY symbol, user_id
            )
            SELECT t.id 
            FROM trades t
            JOIN position_sums ps ON t.symbol = ps.symbol AND t.user_id = ps.user_id
            WHERE t.is_open = true AND t.side = 'buy' AND ps.net_quantity <= 0
        """).fetchall()
        
        # Update those positions to closed
        for row in sold_positions:
            trade_id = row[0]
            db.query(Trade).filter(Trade.id == trade_id).update({"is_open": False})
        
        db.commit()
        print(f"Database maintenance completed: {len(sold_positions)} positions marked as closed")
    except Exception as e:
        db.rollback()
        print(f"Error during database maintenance: {str(e)}")
    finally:
        db.close()

# Run cleanup every day at midnight
schedule.every().day.at("00:00").do(cleanup_database)

# Start the scheduler in a background thread
def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(60)

scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
scheduler_thread.start()