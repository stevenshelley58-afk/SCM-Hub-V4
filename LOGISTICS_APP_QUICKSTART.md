# Logistics App - Quick Start Guide 🚀

## What Was Built

The **Toll Task Request (Logistics App)** foundation has been completed! This is a standalone system for managing all physical movement tasks across the site.

---

## ✅ What's Ready Now

### Database
- 8 complete tables with all relationships
- Row-level security policies
- Auto-generated task numbers (TT-2025-000001)
- Comprehensive indexes for performance

### Backend Services
- Task management (create, assign, track, complete)
- Driver management (CRUD, location tracking, availability)
- Vehicle management (CRUD, maintenance tracking, availability)
- POD capture (photos, signatures, GPS verification)

### Frontend Views
1. **Dispatcher View** (for MLC) - Task queue management
2. **Driver View** (for drivers) - Mobile-optimized task execution
3. **Config View** (for MLC) - Driver/vehicle management

---

## 🚀 How to Access

### Method 1: Switch User in App

1. **Run the app:**
   ```bash
   npm run dev
   ```

2. **Access the Operations Hub** (homepage)

3. **Switch to MLC user:**
   - Click on the user switcher
   - Select "Logistics Coordinator"

4. **Navigate to Logistics views:**
   - "Task Dispatcher" - See all logistics tasks
   - "Configuration" - Manage drivers and vehicles

5. **Switch to Driver user:**
   - Click user switcher
   - Select "Driver"
   - Navigate to "My Tasks"

### Method 2: Direct Navigation

Once the app is running, you can access views directly:
- http://localhost:5173/ (Operations Hub)
- Then navigate using the sidebar links

---

## 📱 Demo Workflow

### 1. Set Up Drivers & Vehicles (MLC)

1. Switch to **MLC user**
2. Go to **Configuration** > **Drivers** tab
3. Click **"+ Add Driver"**
   - Enter: Name: "John Smith", Phone: "555-0001"
4. Go to **Vehicles** tab
5. Click **"+ Add Vehicle"**
   - Enter: Registration: "ABC123", Type: "truck"

### 2. Create a Task (Coming Soon)

For now, tasks would need to be created via:
- Direct database insert
- Materials app integration (when Phase 5 is complete)
- API call to `taskService.createTask()`

### 3. Assign a Task (MLC)

1. Go to **Task Dispatcher**
2. Click on a task in the queue
3. Select a driver from the dropdown
4. Select a vehicle from the dropdown
5. Click **"Assign Task"**

### 4. Execute Task (Driver)

1. Switch to **Driver user**
2. Go to **"My Tasks"**
3. Click **"▶️ Start Task"**
4. Click **"✓ Arrived at Pickup"**
5. Click **"✓ Arrived at Dropoff"**
6. Click **"📸 Capture POD & Complete"**
   - Enter receiver name
   - Task is now complete!

---

## 🗄️ Database Setup

### Option 1: Supabase (Recommended)

1. **Create a Supabase project** at https://supabase.com

2. **Run migrations:**
   ```bash
   # Using Supabase CLI
   supabase migration up
   ```

3. **Or manually execute SQL:**
   - Go to Supabase SQL Editor
   - Copy contents of `supabase/migrations/001_logistics_core_tables.sql`
   - Execute
   - Copy contents of `supabase/migrations/002_logistics_rls_policies.sql`
   - Execute

4. **Create storage bucket:**
   - Go to Storage in Supabase dashboard
   - Create bucket: `logistics-pod`
   - Make it public (or configure signed URLs)

5. **Update Supabase client:**
   - Ensure `services/supabaseClient.ts` has your project credentials

### Option 2: Local PostgreSQL

1. **Install PostgreSQL**
2. **Create database:**
   ```bash
   createdb logistics_app
   ```
3. **Run migrations:**
   ```bash
   psql -d logistics_app -f supabase/migrations/001_logistics_core_tables.sql
   psql -d logistics_app -f supabase/migrations/002_logistics_rls_policies.sql
   ```

---

## 🧪 Testing Without Database

You can test the UI without a database:
1. The views will load but show "No tasks found"
2. Use the Configuration panel to add drivers/vehicles
3. This will work once you have a database connection

---

## 📝 Sample Data (Coming Soon)

Mock data generation will be added in Phase 2. For now, you can:
1. Manually add drivers via Configuration panel
2. Manually add vehicles via Configuration panel
3. Use the service layer to create tasks programmatically

---

## 🔧 Troubleshooting

### "No tasks found"
- Database not connected or empty
- Run database migrations
- Create some tasks manually

### "Error loading data"
- Check browser console for errors
- Verify Supabase client configuration
- Check RLS policies are applied

### "Cannot add driver/vehicle"
- Check database connection
- Verify RLS policies allow inserts
- Check browser console for errors

---

## 📚 Next Steps

After getting Phase 1 running:

1. **Add mock data** - Generate sample tasks, drivers, vehicles
2. **Test workflows** - Create → Assign → Execute → Complete
3. **Proceed to Phase 2** - Enhanced task management
4. **Connect to Materials app** - Event-driven integration

---

## 🎯 Key Files to Know

| File | Purpose |
|------|---------|
| `services/logistics/taskService.ts` | Task CRUD operations |
| `services/logistics/driverService.ts` | Driver management |
| `services/logistics/vehicleService.ts` | Vehicle management |
| `services/logistics/podService.ts` | POD capture logic |
| `features/logistics/LogisticsDispatcherView.tsx` | MLC queue view |
| `features/logistics/LogisticsDriverView.tsx` | Driver mobile view |
| `features/logistics/LogisticsConfigView.tsx` | Configuration panel |
| `types/index.ts` | All logistics types |
| `supabase/migrations/` | Database schema |

---

## 💡 Pro Tips

1. **Use the Configuration panel first** - Add drivers and vehicles before creating tasks
2. **MLC has full access** - Can see and do everything
3. **Driver view is mobile-optimized** - Test on a phone or use Chrome DevTools mobile emulation
4. **Real-time updates on driver view** - Auto-refreshes every 30 seconds
5. **Task numbers auto-generate** - You don't need to provide task_number when creating tasks

---

## 🎉 What's Working Right Now

✅ **Database schema** - Production-ready  
✅ **Service layer** - Full CRUD operations  
✅ **MLC Dispatcher** - View and assign tasks  
✅ **Driver View** - Execute tasks step-by-step  
✅ **Configuration** - Manage drivers and vehicles  
✅ **Type safety** - Zero TypeScript errors  
✅ **Security** - RLS policies in place

---

## 📞 Need Help?

Check these documents:
- `LOGISTICS_APP_PLAN.md` - Complete technical specification
- `LOGISTICS_APP_IMPLEMENTATION.md` - What has been built
- `LOGISTICS_APP_PLANNING_SUMMARY.md` - Planning overview

---

**Status:** Phase 1 Complete ✅  
**Ready for:** Phase 2 Development  
**Production Ready:** Database schema & service layer  
**UI Ready:** Basic views functional

---

Enjoy your new Logistics App! 🚛📦

