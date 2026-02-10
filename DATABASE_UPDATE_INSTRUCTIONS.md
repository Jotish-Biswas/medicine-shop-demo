# Database Update Instructions (Bengali + English)

## সমস্যা / Problem

আগে Statistics এর Present Stock column টা **current stock** দেখাতো। মানে যদি আজকে Shop C তে 100 add করি, তারপর কালকে 50 out করি, তাহলে past এর transaction row তেও 50 দেখাতো (current stock), কিন্তু সেই সময় তো 100 ছিল!

Previously, the Present Stock column showed **current stock**. If you added 100 to Shop C today, then removed 50 tomorrow, even the past transaction would show 50 (current stock), but at that time it was 100!

## সমাধান / Solution

এখন প্রতিটা transaction এর সাথে **সেই সময়ের stock value** save হবে database এ। তাই past transactions এর stock value আর change হবে না।

Now each transaction will save **the stock value at that moment** in the database. So past transaction stock values won't change anymore.

## আপনাকে কি করতে হবে / What You Need to Do

### Step 1: Supabase Database Update

1. Supabase dashboard এ যান: https://supabase.com
2. আপনার project select করুন
3. বাম দিকের menu থেকে **SQL Editor** তে যান
4. নিচের SQL code টা copy করে paste করুন:

```sql
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS stock_after_transaction INTEGER;
```

5. **Run** button এ click করুন
6. সফল হলে দেখাবে: "Success. No rows returned"

### Step 2: Test করুন / Test It

1. আপনার application খুলুন
2. যেকোনো shop এ একটা product add করুন (যেমন: 100 quantity)
3. Statistics modal খুলুন - দেখবেন Present Stock: 100
4. এখন ওই product থেকে কিছু delete করুন (যেমন: 30 quantity)
5. Statistics আবার খুলুন:
   - নতুন transaction এ দেখাবে: Present Stock: 70 ✓
   - **পুরানো transaction এ এখনও দেখাবে: Present Stock: 100** ✓✓

### Important Notes:

- পুরানো transactions (এই update এর আগে যেগুলো create হয়েছিল) তে এখনও current stock দেখাবে (কারণ সেগুলোতে stock_after_transaction value ছিল না)
- নতুন transactions (এই update এর পরে যেগুলো create হবে) তে সঠিক historical stock দেখাবে

- Old transactions (created before this update) will still show current stock (because they don't have stock_after_transaction value)
- New transactions (created after this update) will show correct historical stock

## কোন সমস্যা হলে / If You Face Issues:

1. SQL error দেখালে check করুন যে আপনি সঠিক project এ আছেন কিনা
2. Page refresh করুন application এর
3. Browser console খুলে (F12) কোনো error আছে কিনা দেখুন

যদি কোনো problem থাকে, আমাকে বলুন!
