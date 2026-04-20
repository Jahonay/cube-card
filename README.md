# cube-card
Create a personal biography card that turns into a 3D cube when you hover over it or touch it. 

Example usage: 

HTML:

`<div id="card-a"></div>`

JavaScript:

createCubeCard({

  name:     'Kai Sato',
  
  role:     'Systems Architect',
  
  imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
  
  bio:      'Infrastructure engineer turned systems thinker. Builds distributed systems that scale to millions. Previously led platform at Stripe. Writes about resilience patterns.',
  
  stats:    [
  
    { val: '9',   label: 'Years'   },
    
    { val: '40+', label: 'Systems' },
    
    { val: '5',   label: 'Patents' },

    { val: '1M+', label: 'Users'   },
    
  ],
  
  accent: '#7ecba1',
  
  bg:     '#0f1a14',
  
  width:  300,
  
  height: 380,
  
}, '#card-a');
