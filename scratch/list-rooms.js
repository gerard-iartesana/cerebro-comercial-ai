const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lmozoetpehmdxxremtqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
const sb = createClient(supabaseUrl, supabaseKey);

const token = '6c279e58b5a538a20259c97cf7a79b9ef2037bdd387f0a9d'; // Gerard's token from list-rooms

async function testInit() {
    try {
        console.log("1. Finding personal room by token:", token);
        let { data: personalRoom, error: err1 } = await sb
            .from('chat_rooms')
            .select('*')
            .eq('link_token', token)
            .maybeSingle();

        if (err1) {
            console.error("Error fetching personal room:", err1);
            return;
        }
        console.log("Personal room found:", personalRoom ? personalRoom.id : "null");

        if (!personalRoom) {
            console.log("No personal room. Checking member...");
            const { data: member, error: err2 } = await sb
                .from('chat_room_members')
                .select('room_id, lead_name, lead_email, lead_id')
                .eq('access_token', token)
                .maybeSingle();
            if (err2) {
                console.error("Error fetching member:", err2);
                return;
            }
            if (member) {
                console.log("Member found:", member);
                const { data: groupRoom, error: err3 } = await sb
                    .from('chat_rooms').select('*').eq('id', member.room_id).single();
                if (err3) {
                    console.error("Error fetching group room:", err3);
                    return;
                }
                if (groupRoom) {
                    personalRoom = groupRoom;
                    personalRoom._member_name = member.lead_name;
                    personalRoom._is_group_member = true;
                }
            }
        }

        if (!personalRoom) {
            console.log("Room not found, showing error.");
            return;
        }

        const leadId = personalRoom.lead_id;
        const leadName = personalRoom._member_name || personalRoom.lead_name;
        console.log("Lead Identity:", { name: leadName, lead_id: leadId });

        console.log("2. Fetching last message for room:", personalRoom.id);
        const { data: lastMsgs, error: err4 } = await sb
            .from('chat_messages')
            .select('content, sender_type, created_at')
            .eq('room_id', personalRoom.id)
            .order('created_at', { ascending: false })
            .limit(1);
        if (err4) {
            console.error("Error fetching last messages:", err4);
        } else {
            console.log("Last messages:", lastMsgs);
        }

        if (leadId) {
            console.log("3. Fetching memberships for lead:", leadId);
            const { data: memberships, error: err5 } = await sb
                .from('chat_room_members')
                .select('room_id, lead_name')
                .eq('lead_id', leadId);

            if (err5) {
                console.error("Error fetching memberships:", err5);
            } else if (memberships && memberships.length) {
                console.log("Memberships found:", memberships);
                const groupRoomIds = memberships
                    .map(m => m.room_id)
                    .filter(id => id !== personalRoom.id);

                if (groupRoomIds.length) {
                    console.log("Group room IDs:", groupRoomIds);
                    const { data: groupRooms, error: err6 } = await sb
                        .from('chat_rooms')
                        .select('*, chat_messages(content, sender_type, created_at)')
                        .in('id', groupRoomIds)
                        .order('last_message_at', { ascending: false });

                    if (err6) {
                        console.error("Error fetching group rooms:", err6);
                    } else {
                        console.log("Group rooms found:", groupRooms.length);
                    }
                }
            }
        }
        console.log("SUCCESS!");
    } catch(e) {
        console.error("Crash during simulation:", e);
    }
}
testInit();
