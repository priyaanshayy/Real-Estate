import {useSelector} from 'react-redux';
import { useRef, useState , useEffect } from 'react';
import { getDownloadURL, getStorage,ref, uploadBytesResumable} from 'firebase/storage';
import { app } from '../firebase';
import { updateUserFailure , updateUserStart , updateUserSuccess , deleteUserStart, deleteUserSuccess , deleteUserFailure, signOutUserStart} from '../redux/user/userSlice';
 import {useDispatch} from 'react-redux';
import {Link , useNavigate} from 'react-router-dom';


export default function Profile() {

  const navigate = useNavigate();

  const fileRef=useRef(null);
  const {currentUser,loading,error} = useSelector((state) => state.user)
  const [file,setFile] = useState(undefined);
  const [filePerc , setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
 const [formData,setFormData] = useState({});
 const dispatch=useDispatch();
 const [showListingsError , setshowListingsError] = useState(false);
 const [userListings, setUserListings] = useState ([]);
const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if(file){
      handleFileUpload(file);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

const handleFileUpload =(file) => {
const storage = getStorage(app);
const fileName=new Date().getTime() + file.name;
const  storageRef = ref(storage , fileName);
const uploadTask = uploadBytesResumable(storageRef,file);

uploadTask.on('state_changed',
(snapshot) => {
  const progress = (snapshot.bytesTransferred /snapshot.totalBytes) * 100;
  setFilePerc(Math.round(progress));
},
(error) => {
  setFileUploadError(true);
  console.log(error);
},

() => {
  getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => setFormData({ ...formData, avatar:downloadURL})
   );
  }
 );
};
const handleChange = (e) => {
  setFormData({...formData, [e.target.id] : e.target.value});
};

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
     dispatch(updateUserStart());
     const res = await fetch(`/api/user/update/${currentUser._id}` , {
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json',
      },
      body: JSON.stringify(formData),
     });
     const data = await res.json();
     if(data.success === false) {
      dispatch(updateUserFailure(data.message));
      return;
     }
    dispatch(updateUserSuccess(data)); 
    setUpdateSuccess(true);
  } catch (error) {
    dispatch(updateUserFailure(error.message));
  }
};
 
const handleDeleteUser = async () => {
  try {
    dispatch(deleteUserStart());
    const res = await fetch(`/api/user/delete/${currentUser._id}` , {
      method:'DELETE',
    });
    const data = await res.json();
    if(data.success === false) {
      dispatch(deleteUserFailure(data.message));
      return;
    }
    dispatch(deleteUserSuccess(data)); 
  } catch (error) {
    dispatch(deleteUserFailure(error.message))
  }
};

const handleSignOut = async() => {
try {
  dispatch(signOutUserStart());
  const res=await fetch('/api/auth/signout');
  const data= await res.json();
  if(data.success===false) {
    dispatch(deleteUserFailure(data.message))
    return;
  }
  dispatch(deleteUserSuccess(data));
} catch (error) {
  // eslint-disable-next-line no-undef
  dispatch(deleteUserFailure(data.message))
}
}

// const handleShowListings = async () => {
//   try {
//     setshowListingsError(false);
//     const res = await fetch(`/api/user/listings/${currentUser._id}`);
//     const data = await res.json();
//     if(data.success === false) {
//       showListingsError(true);
//       return;
//     }

//     setUserListings(data);
//   } catch (error) {
//     setshowListingsError(true);
//   }
// };


const handleShowListings = async () => {
  try {
    setshowListingsError(false);
    const res = await fetch(`/api/user/listings/${currentUser._id}`);
    const data = await res.json();
    if (data.success === false) {
      setshowListingsError(true);
      return;
    }

    setUserListings(data);
    
    // Print the count to the console
    console.log('Number of Listings:', data.length);
  } catch (error) {
    setshowListingsError(true);
  }
};

const handleCreateListingClick = async () => {
  try {
    const res = await fetch(`/api/user/listings/${currentUser._id}`);
    const data = await res.json();
    setUserListings(data);

    if (data.length < 2) {
      navigate('/create-listing');
    } else {
      navigate('/subscription-page');
    }
  } catch (error) {
    // Handle error, if any
    console.error('Error fetching user listings:', error);
  }
};

const handleListingDelete = async (listingId) => {
try {
  const res = await fetch(`/api/listing/delete/${listingId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if(data.success===false) {
    console.log(data.message);
    return;
  }
  setUserListings((prev) => 
  prev.filter((listing) => listing._id !==listingId));
} catch (error) {
  console.log(error.message)
}
};


  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl font-bold text-center'>Proflie</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input onChange={(e) => setFile(e.target.files[0])} type='file' ref={fileRef} hidden accept='image/*'/>
        <img onClick={() => fileRef.current.click()} src={formData.avatar || currentUser.avatar} alt="profile" 
        className='rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2'/>
<p className='text-lg self-center'>
  {fileUploadError ? (
    <span className='text-red-700'>Error Image Upload</span>
  ) : (
    filePerc > 0 && filePerc < 100 ? (
      <span className='text-slate-700'>{`Uploading ${filePerc}`}</span>
    ) : (
      filePerc === 100 ? (
        <span className='text-green-800'>Successfully uploaded</span>
      ) : ('')
    )
  )}
</p>


        <input type="text" placeholder='username'
        defaultValue={currentUser.username} id='username' className='border p-3 rounded-lg' onChange={handleChange} />
        <input type="email" placeholder='email'
        defaultValue={currentUser.email} id='email' className='border p-3 rounded-lg' onChange={handleChange}/>
        <input type="password" placeholder='password' id='password' className='border p-3 rounded-lg' onChange={handleChange} />
        <button disabled={loading} className='bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80'>{loading ? 'Loading...' : 'Update'}</button>

{/* <Link
  className='bg-green-700 text-white rounded-lg uppercase text-center hover:opacity-90 p-3'
  to={currentUser.isPro ? '/subscription-page' : userListings.length < 2 ? '/create-listing' : '/subscription-page'}
  onClick={handleCreateListingClick}
>
  Create Listing
</Link> */}


<Link
  className='bg-green-700 text-white rounded-lg uppercase text-center hover:opacity-90 p-3'
  to={userListings.length < 2 ? '/create-listing' : '/subscription-page'}
  onClick={handleCreateListingClick}
>
  Create Listing
</Link>

<Link
  className='bg-blue-700 text-white rounded-lg uppercase text-center hover:opacity-90 p-3 mt-3'
  to="/subscription-page"
>
  Buy Monthly Plan
</Link>


        </form>
        <div className='flex justify-between mt-5'>
          <span onClick={handleDeleteUser} 
          className='text-red-700 cursor-pointer'>Delete Account
          </span>
          <span onClick={handleSignOut} className='text-red-700 cursor-pointer'>Sign out </span>
        </div>
        <p className='text-red-700 mt-5'>{error ? error : ''}</p>
        <p className='text-green-700 mt-5 text-center'>{updateSuccess ? 'Successfully updated' : ''}</p>
        <button onClick={handleShowListings} className='text-green-700 w-full'>Show Listings
        </button> 
        <p className='text-red-700 mt-5'>{showListingsError ? 'error showing listings' : ''}
        </p>
{userListings && userListings.length > 0 && 

<div className='flex flex-col gap-4'>
<h1 className='text-center mt-7 text-2xl font-bold'>Your Listings</h1>
  {userListings.map((listing) => <div key={listing._id} className='border rounded-lg p-3 flex justify-between items-center gap-4'>
    <Link to={`/listing/${listing._id}`}>
      <img src={listing.imageUrls[0]} alt='listing cover' className='h-16 w-16 object-contain '/>
    </Link>
    <Link className='text-slate-700 font-semibold hover:underline truncate flex-1' to={`/listing/${listing._id}`}>
  
      <p>{listing.name}</p>
  
    </Link>
    <div className='flex flex-col items-center'>
      <button onClick={()=> handleListingDelete(listing._id)} className='text-red-700 uppercase'>Delete</button>
      
      <Link to={`/update-listing/${listing._id}`}>

      <button className='text-green-700 uppercase'>Edit</button>
    
      </Link>
    </div>
  </div>
  )}
</div>}


  </div>
  );
}
