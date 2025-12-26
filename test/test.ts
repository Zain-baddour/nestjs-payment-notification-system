// جرب هالـ test:
import * as bcrypt from 'bcrypt';


async function testBcrypt() {
  const password = 'test123';
  
  // 1. شفر
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash:', hash);
  
  // 2. قارن
  const isValid = await bcrypt.compare(password, hash);
  console.log('Valid?', isValid); // لازم يكون true
  
  // 3. جرب بكلمة خاطئة
  const isWrong = await bcrypt.compare('wrong', hash);
  console.log('Wrong valid?', isWrong); // لازم يكون false
}