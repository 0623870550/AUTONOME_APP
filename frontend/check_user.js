
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cnskvexluuaxdxsquwzc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuc2t2ZXhsdXVheGR4c3F1d3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MjU1NTYsImV4cCI6MjA4MzIwMTU1Nn0.dfgWZWxfLO81OZKoADC0dUccxv8IcHW3Jn1reRQy-90';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('email', 'flavien.gomila@sdmis.fr');

  if (error) {
    console.error('Error fetching agents:', error);
  } else {
    console.log('Agents found:', data);
  }
}

checkUser();
