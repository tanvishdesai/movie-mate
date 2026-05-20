"use client"
import React, { useEffect, useState } from 'react'
import '../Popup.css'
import { MdLocationOn, MdClose } from 'react-icons/md'
import { BiSearch } from 'react-icons/bi'
import { toast } from 'react-toastify'

const LocationPopup = (
    {
        setShowLocationPopup
    }: {
        setShowLocationPopup: React.Dispatch<React.SetStateAction<boolean>>
    }
) => {
    const [cities, setCities] = useState<any[]>([])
    const [selectedCity, setSelectedCity] = useState<string>("")
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [filteredCities, setFilteredCities] = useState<any[]>([])

    const getcities = async () => {
        const indianCities = [
            "Jabalpur", "Mumbai", "Delhi", "Bangalore", "Hyderabad", 
            "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur",
            "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore",
            "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", 
            "Patna", "Vadodara"
        ];

        const citiesData = indianCities.map((city) => {
            return {
                label: city,
                value: city
            }
        })

        setCities(citiesData)
        setFilteredCities(citiesData)
    }

    useEffect(() => {
        getcities()
    }, [])

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredCities(cities)
        } else {
            const filtered = cities.filter(city => 
                city.label.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredCities(filtered)
        }
    }, [searchTerm, cities])

    const handleSave = () => {
        if (!selectedCity) {
            toast("Please select a city", { type: 'warning' })
            return
        }

        fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/changeCity`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                city: selectedCity
            })
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.ok) {
                    setShowLocationPopup(false)
                    window.location.reload()
                }
            })
            .catch((err) => {
                toast(err.message, { type: 'error' })
                console.log(err)
            })
    }

    return (
        <div className='popup-bg'>
            <div className='location-popup'>
                <div className="location-popup-header">
                    <h2>
                        <MdLocationOn className="location-icon" />
                        Select Your City
                    </h2>
                    <button 
                        className="close-button"
                        onClick={() => setShowLocationPopup(false)}
                        aria-label="Close"
                    >
                        <MdClose />
                    </button>
                </div>

                <div className="location-search-box">
                    <BiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search for your city"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="city-grid">
                    {filteredCities.length > 0 ? (
                        filteredCities.map((city) => (
                            <div 
                                key={city.value} 
                                className={`city-item ${selectedCity === city.value ? 'selected' : ''}`}
                                onClick={() => setSelectedCity(city.value)}
                            >
                                {city.label}
                            </div>
                        ))
                    ) : (
                        <div className="no-results">No cities found matching "{searchTerm}"</div>
                    )}
                </div>

                <div className="popup-actions">
                    <button 
                        className="secondary-btn"
                        onClick={() => setShowLocationPopup(false)}
                    >
                        Cancel
                    </button>
                    
                    <button 
                        className="primary-btn"
                        onClick={handleSave}
                        disabled={!selectedCity}
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    )
}

export default LocationPopup